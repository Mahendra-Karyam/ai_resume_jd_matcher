import { GoogleGenAI } from "@google/genai";
import { HELP_KNOWLEDGE_BASE } from "../data/helpKnowledgeBase.js";

// New unified Google Gen AI SDK — correctly supports both legacy "AIza" Standard
// keys and the newer "AQ." Auth keys that Google now issues by default.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Overridable via GEMINI_MODEL so this can be bumped without a code change.
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-3.6-flash";

// Free-tier Gemini keys have a small daily request quota PER MODEL (this app
// hit real 429 RESOURCE_EXHAUSTED errors from this in practice — see the
// Library Management System project, which had the same issue). Different
// models draw from separate quota buckets, so if the primary model's quota
// is used up, a different model can still work for the rest of the day.
// Overridable via GEMINI_FALLBACK_MODEL — set this to any Gemini model your
// API key has access to that you're not already using elsewhere, so its
// quota is untouched when the primary model runs out.
const FALLBACK_MODEL_NAME = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash-lite";

/**
 * Strips markdown code fences just in case (safety net — responseMimeType usually
 * makes this unnecessary, but keeps behavior consistent if Gemini adds stray text).
 */
const cleanJson = (text) => {
  return text.replace(/```json/gi, "").replace(/```/g, "").trim();
};

/**
 * Calls Gemini's generateContent with MODEL_NAME first. If that call fails
 * for any reason (most notably a 429 once the free tier's daily quota for
 * that model is used up), it automatically retries once with
 * FALLBACK_MODEL_NAME before giving up. Used by every AI call in this file
 * (resume parsing, job parsing, matching, and the help chat widget) so a
 * quota outage on the primary model doesn't take down all four features at
 * once.
 *
 * @param {object} params - everything generateContent needs EXCEPT `model` (i.e. `contents` and `config`)
 */
const generateWithFallback = async (params) => {
  try {
    return await ai.models.generateContent({ model: MODEL_NAME, ...params });
  } catch (primaryError) {
    console.error(
      `Primary model "${MODEL_NAME}" failed (${primaryError.status || "no status"}), trying fallback model "${FALLBACK_MODEL_NAME}"...`
    );
    // Let the fallback attempt's own error (if it also fails) propagate up
    // to the caller's catch block as before.
    return await ai.models.generateContent({ model: FALLBACK_MODEL_NAME, ...params });
  }
};

/**
 * Sends raw resume text to Gemini and returns structured data:
 * { skills: [], education: [], experience: [], summary: "" }
 */
export const extractResumeData = async (resumeText) => {
  const prompt = `You are a resume parsing engine. Given raw resume text, extract structured information.
Respond ONLY with valid JSON, no markdown formatting, no preamble, no explanation. Use this exact schema:
{
  "skills": ["skill1", "skill2", ...],
  "education": ["degree - institution - year", ...],
  "experience": ["Job Title at Company (duration) - one-line summary", ...],
  "summary": "2-3 sentence professional summary of the candidate"
}
Normalize skill names (e.g. "ReactJS" -> "React", "JS" -> "JavaScript"). Include both technical and soft skills.

RESUME TEXT:
${resumeText.slice(0, 15000)}`;

  const response = await generateWithFallback({
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  return JSON.parse(cleanJson(response.text));
};

/**
 * Extracts required skills from a job description.
 */
export const extractJobRequirements = async (jobText) => {
  const prompt = `You are a job description parsing engine. Given a raw job description, extract the required and preferred skills.
Respond ONLY with valid JSON, no markdown formatting. Use this exact schema:
{
  "requiredSkills": ["skill1", "skill2", ...],
  "title": "inferred job title",
  "seniority": "e.g. Junior / Mid / Senior"
}
Normalize skill names consistently (e.g. "ReactJS" -> "React").

JOB DESCRIPTION:
${jobText.slice(0, 15000)}`;

  const response = await generateWithFallback({
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  return JSON.parse(cleanJson(response.text));
};

/**
 * Core matching function: compares resume text against a job description
 * and returns a score, matched/missing skills, and tailored suggestions.
 */
export const matchResumeToJob = async (resumeText, jobText) => {
  const prompt = `You are an expert technical recruiter and resume coach. Compare the RESUME against the JOB DESCRIPTION.

Respond ONLY with valid JSON (no markdown formatting), using this exact schema:
{
  "matchScore": <integer 0-100>,
  "matchedSkills": ["skill present in both resume and JD", ...],
  "missingSkills": ["skill required by JD but absent/weak in resume", ...],
  "suggestions": ["specific, actionable suggestion to improve the resume for this JD", ...],
  "summary": "2-3 sentence overall assessment of fit"
}

Scoring guidance:
- 85-100: excellent fit, most required skills present, relevant experience level
- 60-84: good fit, some gaps but strong overlap
- 35-59: partial fit, notable skill or experience gaps
- 0-34: weak fit, major mismatch

Base the score on skill overlap, relevant experience, and seniority alignment. Provide 3-6 matchedSkills, 3-6 missingSkills, and 3-5 concrete suggestions.

RESUME:
${resumeText.slice(0, 12000)}

---

JOB DESCRIPTION:
${jobText.slice(0, 8000)}`;

  const response = await generateWithFallback({
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  return JSON.parse(cleanJson(response.text));
};

/**
 * Powers the in-app help chat widget. Takes the new user message plus recent
 * conversation history (for context across turns) and replies in plain text,
 * grounded in HELP_KNOWLEDGE_BASE (see server/data/helpKnowledgeBase.js) plus
 * an optional block of live, per-request context (current page, current
 * user's own saved data) appended after it — same idea as the Library
 * Management System project's buildSystemPrompt.
 *
 * @param {Array<{role: "user"|"assistant", text: string}>} history - prior turns, oldest first
 * @param {string} userMessage - the new question from the user
 * @param {string} [liveContext] - optional extra system-prompt text (current page, current user's data)
 * @returns {Promise<string>} the assistant's plain-text reply
 */
export const answerHelpQuestion = async (history, userMessage, liveContext = "") => {
  // Gemini's chat format uses role "model" instead of "assistant" for its own turns.
  const contents = [
    ...history.map((turn) => ({
      role: turn.role === "assistant" ? "model" : "user",
      parts: [{ text: turn.text }],
    })),
    { role: "user", parts: [{ text: userMessage }] },
  ];

  const systemInstruction = liveContext
    ? `${HELP_KNOWLEDGE_BASE}\n\n${liveContext}`
    : HELP_KNOWLEDGE_BASE;

  const response = await generateWithFallback({
    contents,
    config: {
      systemInstruction,
      // Plain conversational text here, not JSON — this is a chat reply, not structured data.
    },
  });

  return response.text.trim();
};

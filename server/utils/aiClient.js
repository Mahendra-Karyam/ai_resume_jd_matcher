import { GoogleGenAI } from "@google/genai";
import { HELP_KNOWLEDGE_BASE } from "../data/helpKnowledgeBase.js";

// New unified Google Gen AI SDK — correctly supports both legacy "AIza" Standard
// keys and the newer "AQ." Auth keys that Google now issues by default.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL_NAME = "gemini-3.6-flash";

/**
 * Strips markdown code fences just in case (safety net — responseMimeType usually
 * makes this unnecessary, but keeps behavior consistent if Gemini adds stray text).
 */
const cleanJson = (text) => {
  return text.replace(/```json/gi, "").replace(/```/g, "").trim();
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

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
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

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
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

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  return JSON.parse(cleanJson(response.text));
};

/**
 * Powers the in-app help chat widget. Takes the new user message plus recent
 * conversation history (for context across turns) and replies in plain text,
 * grounded in HELP_KNOWLEDGE_BASE (see server/data/helpKnowledgeBase.js).
 *
 * @param {Array<{role: "user"|"assistant", text: string}>} history - prior turns, oldest first
 * @param {string} userMessage - the new question from the user
 * @returns {Promise<string>} the assistant's plain-text reply
 */
export const answerHelpQuestion = async (history, userMessage) => {
  // Gemini's chat format uses role "model" instead of "assistant" for its own turns.
  const contents = [
    ...history.map((turn) => ({
      role: turn.role === "assistant" ? "model" : "user",
      parts: [{ text: turn.text }],
    })),
    { role: "user", parts: [{ text: userMessage }] },
  ];

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents,
    config: {
      systemInstruction: HELP_KNOWLEDGE_BASE,
      // Plain conversational text here, not JSON — this is a chat reply, not structured data.
    },
  });

  return response.text.trim();
};
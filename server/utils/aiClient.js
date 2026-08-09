import { GoogleGenAI } from "@google/genai";

// New unified Google Gen AI SDK — correctly supports both legacy "AIza" Standard
// keys and the newer "AQ." Auth keys that Google now issues by default.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL_NAME = "gemini-3.6-flash";

const cleanJson = (text) => {
  return text.replace(/```json/gi, "").replace(/```/g, "").trim();
};

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
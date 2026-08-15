import jwt from "jsonwebtoken";
import { answerHelpQuestion } from "../utils/aiClient.js";
import User from "../models/User.js";
import Resume from "../models/Resume.js";
import JobPosting from "../models/JobPosting.js";
import Match from "../models/Match.js";

// Cap history length sent to the model to keep prompts small and cheap —
// only the last few turns are needed for reasonable conversational context.
// (Same idea as MAX_HISTORY_TURNS in the Library Management System's
// assistantController.js.)
const MAX_HISTORY_TURNS = 8;

// Safety caps so a user with a LOT of saved items never blows up the
// prompt size / cost. (Mirrors MAX_BOOKS_IN_CONTEXT in the Library project.)
const MAX_RESUMES_IN_CONTEXT = 10;
const MAX_JOBS_IN_CONTEXT = 10;
const MAX_MATCHES_IN_CONTEXT = 10;

// Server-side allowlist mapping route paths to a plain description. The
// frontend only ever sends the raw pathname (e.g. "/dashboard"), and we
// translate it here — this avoids trusting arbitrary free text from the
// client for something that gets fed into the AI prompt.
// (Same pattern as PAGE_DESCRIPTIONS in the Library project's
// assistantController.js, adapted to this app's routes from client/src/App.jsx.)
const PAGE_DESCRIPTIONS = {
  "/": "the Home/landing page",
  "/login": "the login page",
  "/register": "the sign-up page",
  "/dashboard": "the Dashboard (uploading resumes, adding job descriptions, and running matches)",
  "/history": "the Match History page (past match results)",
};

function describeCurrentPage(pathname) {
  if (typeof pathname !== "string") return "an unspecified page";
  if (PAGE_DESCRIPTIONS[pathname]) return PAGE_DESCRIPTIONS[pathname];
  // Match result route includes a dynamic match id, e.g. /matches/64f1...
  if (pathname.startsWith("/matches/")) {
    return "a Match Result page (viewing one specific match's score, matched/missing skills, and suggestions)";
  }
  return "a page on the site";
}

// Reads the Authorization: Bearer <token> header (if present) and decodes
// it to figure out who's asking. Never throws — an invalid/missing token
// just means anonymous. (Same pattern as identifyRequester in the Library
// project; this app's JWT payload only carries { id }, so we look the user
// up to get their name for a friendlier context string.)
async function identifyRequester(req) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return { role: "anonymous" };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) return { role: "anonymous" };

    const user = await User.findById(decoded.id).select("name email").lean();
    if (!user) return { role: "anonymous" };

    return { role: "user", userId: decoded.id, name: user.name, email: user.email };
  } catch {
    return { role: "anonymous" };
  }
}

// Builds a short paragraph telling the model who it's talking to and what
// THEIR OWN data looks like right now — this app has no shared public
// catalog (unlike the Library project's book catalog), so the closest
// equivalent live context is the current user's own saved resumes, job
// descriptions, and match history, which are private per-account data.
// Never reveals any other user's data.
async function buildUserContext(requester) {
  if (requester.role !== "user") {
    return "The current visitor is NOT logged in (anonymous). Encourage them to register or log in if their question requires an account — they can still ask general questions about how the app works.";
  }

  try {
    const [resumes, jobs, matches] = await Promise.all([
      Resume.find({ user: requester.userId }, "fileName parsedData.skills createdAt")
        .sort({ createdAt: -1 })
        .limit(MAX_RESUMES_IN_CONTEXT)
        .lean(),
      JobPosting.find({ user: requester.userId }, "title company requiredSkills")
        .sort({ createdAt: -1 })
        .limit(MAX_JOBS_IN_CONTEXT)
        .lean(),
      Match.find({ user: requester.userId }, "matchScore createdAt")
        .sort({ createdAt: -1 })
        .limit(MAX_MATCHES_IN_CONTEXT)
        .populate("job", "title")
        .lean(),
    ]);

    const lines = [`The current visitor is logged in as "${requester.name}".`];

    if (resumes.length) {
      const resumeRows = resumes
        .map((r) => `  - "${r.fileName}" (skills: ${(r.parsedData?.skills || []).slice(0, 8).join(", ") || "not parsed yet"})`)
        .join("\n");
      lines.push(`They have ${resumes.length} saved resume${resumes.length === 1 ? "" : "s"}:\n${resumeRows}`);
    } else {
      lines.push("They have no resumes uploaded yet.");
    }

    if (jobs.length) {
      const jobRows = jobs
        .map((j) => `  - "${j.title}"${j.company ? ` at ${j.company}` : ""} (required skills: ${(j.requiredSkills || []).slice(0, 8).join(", ") || "not parsed yet"})`)
        .join("\n");
      lines.push(`They have ${jobs.length} saved job description${jobs.length === 1 ? "" : "s"}:\n${jobRows}`);
    } else {
      lines.push("They have no job descriptions saved yet.");
    }

    if (matches.length) {
      const avgScore = Math.round(
        matches.reduce((sum, m) => sum + (m.matchScore || 0), 0) / matches.length
      );
      // Listed most-recent-first (matches query above is sorted that way) so
      // the model can answer "what was my LAST/most recent match score"
      // directly instead of only having an average to work with.
      const matchRows = matches
        .map((m, i) => `  ${i === 0 ? "(most recent) " : ""}- ${m.matchScore}%${m.job?.title ? ` for "${m.job.title}"` : ""}`)
        .join("\n");
      lines.push(
        `They have run ${matches.length} match${matches.length === 1 ? "" : "es"} so far (most recent first), averaging ${avgScore}%:\n${matchRows}`
      );
    } else {
      lines.push("They haven't run any matches yet.");
    }

    return lines.join("\n");
  } catch (err) {
    console.error("Failed to load user's saved data for chatbot context:", err);
    return `The current visitor is logged in as "${requester.name}", but their saved resumes/jobs/matches couldn't be loaded right now — don't guess at what they have saved.`;
  }
}

// System prompt builder. The static product knowledge lives in
// data/helpKnowledgeBase.js (HELP_KNOWLEDGE_BASE) — this function's job is
// to append the live, per-request context (current user's data, current
// page) after that static string. (Same shape as buildSystemPrompt in the
// Library project's assistantController.js.)
function buildSystemPrompt(userContext, pageDescription) {
  return `Who you're talking to right now:
${userContext}

They are currently viewing: ${pageDescription}.

Guidelines for the live context above:
- You know the current visitor's own saved resumes, job descriptions, and match history (if logged in) — use that to answer things like "what resumes do I have" or "what was my last match score" personally and directly, using the actual most-recent score listed, not the average, when asked about their "last"/"latest"/"most recent" match. Never reveal or guess at any OTHER user's data.
- Use the "currently viewing" info to tailor guidance — e.g. if they're on the Dashboard and ask "how do I get started", point them to the upload area right there rather than generic instructions. If asked what page they're on, answer directly using this info.`;
}

export const chatWithAssistant = async (req, res) => {
  try {
    const { message, history, currentPage } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ message: "A message is required" });
    }

    const safeHistory = Array.isArray(history)
      ? history
          .filter((turn) => turn && typeof turn.text === "string" && turn.text.trim())
          .slice(-MAX_HISTORY_TURNS)
      : [];

    const requester = await identifyRequester(req);
    const userContext = await buildUserContext(requester);
    const pageDescription = describeCurrentPage(currentPage);
    const liveContext = buildSystemPrompt(userContext, pageDescription);

    const reply = await answerHelpQuestion(safeHistory, message.trim(), liveContext);

    res.json({ reply });
  } catch (error) {
    console.error("Assistant error:", error);
    // Fall back to a plain apology instead of a raw 500 — keeps the widget
    // usable instead of showing a hard error even when Gemini itself is
    // down/misconfigured. (Same resilience idea as the Library project's
    // faq-fallback-error path, adapted since this app has no FAQ list to
    // fall back to.)
    res.json({
      reply:
        "Sorry, I'm having trouble answering right now. Please try again in a moment.",
    });
  }
};

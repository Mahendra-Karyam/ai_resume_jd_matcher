import Match from "../models/Match.js";
import Resume from "../models/Resume.js";
import JobPosting from "../models/JobPosting.js";
import { matchResumeToJob } from "../utils/aiClient.js";

export const createMatch = async (req, res) => {
  try {
    const { resumeId, jobId } = req.body;

    const resume = await Resume.findOne({ _id: resumeId, user: req.userId });
    const job = await JobPosting.findOne({ _id: jobId, user: req.userId });

    if (!resume) return res.status(404).json({ message: "Resume not found" });
    if (!job) return res.status(404).json({ message: "Job not found" });

    const result = await matchResumeToJob(resume.rawText, job.rawText);

    const match = await Match.create({
      user: req.userId,
      resume: resume._id,
      job: job._id,
      matchScore: result.matchScore,
      matchedSkills: result.matchedSkills || [],
      missingSkills: result.missingSkills || [],
      suggestions: result.suggestions || [],
      summary: result.summary || "",
    });

    const populated = await match.populate([
      { path: "resume", select: "fileName" },
      { path: "job", select: "title company" },
    ]);

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyMatches = async (req, res) => {
  try {
    const matches = await Match.find({ user: req.userId })
      .populate("resume", "fileName")
      .populate("job", "title company")
      .sort({ createdAt: -1 });
    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMatchById = async (req, res) => {
  try {
    const match = await Match.findOne({ _id: req.params.id, user: req.userId })
      .populate("resume", "fileName")
      .populate("job", "title company rawText");
    if (!match) return res.status(404).json({ message: "Match not found" });
    res.json(match);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteMatch = async (req, res) => {
  try {
    const match = await Match.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!match) return res.status(404).json({ message: "Match not found" });
    res.json({ message: "Match deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

import JobPosting from "../models/JobPosting.js";
import { extractJobRequirements } from "../utils/aiClient.js";

export const createJob = async (req, res) => {
  try {
    const { title, company, rawText } = req.body;

    if (!rawText || rawText.trim().length < 30) {
      return res.status(400).json({ message: "Job description text is too short" });
    }

    const extracted = await extractJobRequirements(rawText);

    const job = await JobPosting.create({
      user: req.userId,
      title: title || extracted.title || "Untitled Role",
      company,
      rawText,
      requiredSkills: extracted.requiredSkills || [],
    });

    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyJobs = async (req, res) => {
  try {
    const jobs = await JobPosting.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getJobById = async (req, res) => {
  try {
    const job = await JobPosting.findOne({ _id: req.params.id, user: req.userId });
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const job = await JobPosting.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json({ message: "Job deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

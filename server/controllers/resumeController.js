import Resume from "../models/Resume.js";
import { extractTextFromFile } from "../utils/parseFile.js";
import { extractResumeData } from "../utils/aiClient.js";

export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const rawText = await extractTextFromFile(req.file.path);

    if (!rawText || rawText.length < 30) {
      return res.status(400).json({ message: "Could not extract meaningful text from file" });
    }

    const parsedData = await extractResumeData(rawText);

    const resume = await Resume.create({
      user: req.userId,
      fileName: req.file.originalname,
      filePath: req.file.path,
      rawText,
      parsedData,
    });

    res.status(201).json(resume);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.userId })
      .select("-rawText")
      .sort({ createdAt: -1 });
    res.json(resumes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.userId });
    if (!resume) return res.status(404).json({ message: "Resume not found" });
    res.json(resume);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!resume) return res.status(404).json({ message: "Resume not found" });
    res.json({ message: "Resume deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

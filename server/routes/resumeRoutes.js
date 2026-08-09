import express from "express";
import protect from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import {
  uploadResume,
  getMyResumes,
  getResumeById,
  deleteResume,
} from "../controllers/resumeController.js";

const router = express.Router();

router.use(protect);
router.post("/upload", upload.single("resume"), uploadResume);
router.get("/", getMyResumes);
router.get("/:id", getResumeById);
router.delete("/:id", deleteResume);

export default router;

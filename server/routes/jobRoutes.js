import express from "express";
import protect from "../middleware/auth.js";
import { createJob, getMyJobs, getJobById, deleteJob } from "../controllers/jobController.js";

const router = express.Router();

router.use(protect);
router.post("/", createJob);
router.get("/", getMyJobs);
router.get("/:id", getJobById);
router.delete("/:id", deleteJob);

export default router;

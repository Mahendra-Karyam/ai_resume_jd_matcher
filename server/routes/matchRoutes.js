import express from "express";
import protect from "../middleware/auth.js";
import { createMatch, getMyMatches, getMatchById, deleteMatch } from "../controllers/matchController.js";

const router = express.Router();

router.use(protect);
router.post("/", createMatch);
router.get("/", getMyMatches);
router.get("/:id", getMatchById);
router.delete("/:id", deleteMatch);

export default router;

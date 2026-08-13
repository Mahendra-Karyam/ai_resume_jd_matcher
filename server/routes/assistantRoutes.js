import express from "express";
import { chatWithAssistant } from "../controllers/assistantController.js";

const router = express.Router();

// Intentionally public (no `protect` middleware) — the help widget should
// work even for visitors who haven't logged in yet (e.g. on the Home page).
router.post("/chat", chatWithAssistant);

export default router;
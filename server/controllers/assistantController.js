import { answerHelpQuestion } from "../utils/aiClient.js";

// Cap history length sent to the model to keep prompts small and cheap —
// only the last few turns are needed for reasonable conversational context.
const MAX_HISTORY_TURNS = 8;

export const chatWithAssistant = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ message: "A message is required" });
    }

    const safeHistory = Array.isArray(history)
      ? history
          .filter((turn) => turn && typeof turn.text === "string" && turn.text.trim())
          .slice(-MAX_HISTORY_TURNS)
      : [];

    const reply = await answerHelpQuestion(safeHistory, message.trim());

    res.json({ reply });
  } catch (error) {
    res.status(500).json({ message: error.message || "Assistant failed to respond" });
  }
};
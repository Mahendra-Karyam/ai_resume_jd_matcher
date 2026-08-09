import express from "express";
import { body } from "express-validator";
import { registerUser, loginUser, getMe } from "../controllers/authController.js";
import protect from "../middleware/auth.js";

const router = express.Router();

router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be 6+ characters"),
  ],
  registerUser
);

router.post("/login", loginUser);
router.get("/me", protect, getMe);

export default router;

import mongoose from "mongoose";

const jobPostingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    company: { type: String },
    rawText: { type: String, required: true },
    requiredSkills: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model("JobPosting", jobPostingSchema);

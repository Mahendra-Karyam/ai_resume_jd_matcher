import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    resume: { type: mongoose.Schema.Types.ObjectId, ref: "Resume", required: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "JobPosting", required: true },
    matchScore: { type: Number, required: true, min: 0, max: 100 },
    matchedSkills: [{ type: String }],
    missingSkills: [{ type: String }],
    suggestions: [{ type: String }],
    summary: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Match", matchSchema);

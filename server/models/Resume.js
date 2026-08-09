import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    rawText: { type: String, required: true },
    parsedData: {
      skills: [{ type: String }],
      education: [{ type: String }],
      experience: [{ type: String }],
      summary: { type: String },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Resume", resumeSchema);

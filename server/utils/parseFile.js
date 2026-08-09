import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

/**
 * Extracts raw text from a PDF or DOCX file on disk.
 * @param {string} filePath - absolute path to the uploaded file
 * @returns {Promise<string>} extracted plain text
 */
export const extractTextFromFile = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const buffer = fs.readFileSync(filePath);

  if (ext === ".pdf") {
    const data = await pdfParse(buffer);
    return data.text.trim();
  }

  if (ext === ".docx" || ext === ".doc") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  throw new Error("Unsupported file type. Please upload a PDF or DOCX file.");
};

import fs from "fs"; //Node's file system module, used to read the file from disk.
import path from "path"; //path – helps extract the file extension (like .pdf or .docx) from the file path.
import pdfParse from "pdf-parse"; //pdfParse – a library that reads PDF files and pulls the text out.
import mammoth from "mammoth"; //mammoth – a library that reads Word documents (.docx) and pulls the text out.

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

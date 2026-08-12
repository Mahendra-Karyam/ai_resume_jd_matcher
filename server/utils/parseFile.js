import path from "path"; // path – helps extract the file extension (like .pdf or .docx) from the filename
import pdfParse from "pdf-parse"; // pdfParse – a library that reads PDF files and pulls the text out.
import mammoth from "mammoth"; // mammoth – a library that reads Word documents (.docx) and pulls the text out.

/**
 * Extracts raw text from a PDF or DOCX file buffer.
 * @param {Buffer} buffer - the uploaded file's in-memory buffer
 * @param {string} originalName - original filename, used to detect the extension
 * @returns {Promise<string>} extracted plain text
 */
export const extractTextFromFile = async (buffer, originalName) => {
  const ext = path.extname(originalName).toLowerCase();

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
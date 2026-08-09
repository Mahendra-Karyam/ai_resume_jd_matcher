import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import api from "../api/axios.js";

export default function ResumeUpload({ onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("resume", file);

    try {
      const { data } = await api.post("/resumes/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUploaded(data);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [onUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition
          ${isDragActive ? "border-brand-500 bg-brand-50" : "border-gray-300 bg-white hover:border-brand-400"}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <p className="text-brand-600 font-medium">Parsing resume with AI…</p>
        ) : isDragActive ? (
          <p className="text-brand-600">Drop the resume here…</p>
        ) : (
          <>
            <p className="font-medium text-gray-700">Drag & drop your resume here</p>
            <p className="text-sm text-gray-400 mt-1">PDF or DOCX, max 5MB</p>
          </>
        )}
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}

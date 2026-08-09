import React, { useState } from "react";
import api from "../api/axios.js";

export default function JobDescriptionInput({ onCreated }) {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rawText.trim().length < 30) {
      setError("Please paste a fuller job description (30+ characters).");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/jobs", { title, company, rawText });
      onCreated(data);
      setTitle("");
      setCompany("");
      setRawText("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save job description");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Job title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Company (optional)"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>
      <textarea
        rows={8}
        placeholder="Paste the full job description here…"
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-md py-2 font-medium"
      >
        {loading ? "Analyzing with AI…" : "Save Job Description"}
      </button>
    </form>
  );
}

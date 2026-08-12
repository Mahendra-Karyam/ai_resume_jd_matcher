import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import ResumeUpload from "../components/ResumeUpload.jsx";
import JobDescriptionInput from "../components/JobDescriptionInput.jsx";

export default function Dashboard() {
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedResume, setSelectedResume] = useState("");
  const [selectedJob, setSelectedJob] = useState("");
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const navigate = useNavigate();

  const loadData = async () => {
    const [resumeRes, jobRes] = await Promise.all([api.get("/resumes"), api.get("/jobs")]);
    setResumes(resumeRes.data);
    setJobs(jobRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResumeUploaded = (resume) => {
    setResumes((prev) => [resume, ...prev]);
    setSelectedResume(resume._id);
  };

  const handleJobCreated = (job) => {
    setJobs((prev) => [job, ...prev]);
    setSelectedJob(job._id);
  };

  const handleDeleteResume = async (id) => {
    if (!window.confirm("Delete this resume? This can't be undone.")) return;
    setDeletingId(id);
    setError("");
    try {
      await api.delete(`/resumes/${id}`);
      setResumes((prev) => prev.filter((r) => r._id !== id));
      if (selectedResume === id) setSelectedResume("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete resume");
    } finally {
      setDeletingId("");
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm("Delete this job description? This can't be undone.")) return;
    setDeletingId(id);
    setError("");
    try {
      await api.delete(`/jobs/${id}`);
      setJobs((prev) => prev.filter((j) => j._id !== id));
      if (selectedJob === id) setSelectedJob("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete job");
    } finally {
      setDeletingId("");
    }
  };

  const handleMatch = async () => {
    if (!selectedResume || !selectedJob) {
      setError("Please provide both a resume and a job description to continue.");
      return;
    }
    setError("");
    setMatching(true);
    try {
      const { data } = await api.post("/matches", {
        resumeId: selectedResume,
        jobId: selectedJob,
      });
      navigate(`/matches/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Matching failed");
    } finally {
      setMatching(false);
    }
  };

  // Fully custom dropdown — options list also includes a delete (trash) button
  // per row, so there's no separate "Manage" section; everything lives in one place.
  const Dropdown = ({ value, onChange, placeholder, options, onDelete, deletingId }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
      const handleClickOutside = (e) => {
        if (ref.current && !ref.current.contains(e.target)) setOpen(false);
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedLabel = options.find((o) => o.value === value)?.label;

    return (
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`w-full flex items-center justify-between border rounded-md px-3 py-2 text-sm bg-white text-left transition-colors
            ${open ? "border-brand-400 ring-2 ring-brand-100" : "border-gray-300 hover:border-gray-400"}`}
        >
          <span className={selectedLabel ? "text-gray-800 truncate" : "text-gray-400"}>
            {selectedLabel || placeholder}
          </span>
          <svg
            className={`h-4 w-4 text-gray-400 shrink-0 ml-2 transition-transform duration-150 ${open ? "rotate-180" : "rotate-0"}`}
            viewBox="0 0 20 20"
            fill="none"
          >
            <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {open && (
          <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-xl ring-1 ring-black/5 py-1 max-h-48 overflow-auto">
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-50"
            >
              {placeholder}
            </button>

            {options.length === 0 && (
              <p className="px-3 py-2 text-xs text-gray-400">Nothing saved yet.</p>
            )}

            {options.map((opt) => (
              <div
                key={opt.value}
                className={`group flex items-center justify-between px-3 py-2 text-sm hover:bg-brand-50
                  ${value === opt.value ? "bg-brand-50 text-brand-700 font-medium" : "text-gray-700"}`}
              >
                <button
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className="flex-1 text-left truncate"
                >
                  {opt.label}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(opt.value);
                  }}
                  disabled={deletingId === opt.value}
                  title="Delete"
                  className="ml-2 shrink-0 text-gray-300 opacity-0 group-hover:opacity-100
                    hover:text-red-600 disabled:opacity-40 transition-opacity"
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
                    <path
                      d="M4 6h12M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6m2 0-.6 9.4a1.5 1.5 0 0 1-1.5 1.4H8.1a1.5 1.5 0 0 1-1.5-1.4L6 6h8Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* ---------- Resumes column ---------- */}
        <div className="flex flex-col bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold mb-3">1. Upload Resume</h2>
          <ResumeUpload onUploaded={handleResumeUploaded} />

          <div className="mt-4 flex-1 flex flex-col justify-end">
            {resumes.length > 0 && (
              <div>
                <label className="text-sm text-gray-500">Select a resume to match:</label>
                <div className="mt-1">
                  <Dropdown
                    value={selectedResume}
                    onChange={setSelectedResume}
                    placeholder="-- choose resume --"
                    options={resumes.map((r) => ({ value: r._id, label: r.fileName }))}
                    onDelete={handleDeleteResume}
                    deletingId={deletingId}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ---------- Job descriptions column ---------- */}
        <div className="flex flex-col bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold mb-3">2. Add Job Description</h2>
          <JobDescriptionInput onCreated={handleJobCreated} />

          <div className="mt-4 flex-1 flex flex-col justify-end">
            {jobs.length > 0 && (
              <div>
                <label className="text-sm text-gray-500">Select a job to match:</label>
                <div className="mt-1">
                  <Dropdown
                    value={selectedJob}
                    onChange={setSelectedJob}
                    placeholder="-- choose job --"
                    options={jobs.map((j) => ({
                      value: j._id,
                      label: `${j.title}${j.company ? ` @ ${j.company}` : ""}`,
                    }))}
                    onDelete={handleDeleteJob}
                    deletingId={deletingId}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-12 text-center relative z-0">
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <button
          onClick={handleMatch}
          disabled={matching}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium px-8 py-3 rounded-lg"
        >
          {matching ? "Running AI Match…" : "Run Match Analysis"}
        </button>
      </div>
    </div>
  );
}


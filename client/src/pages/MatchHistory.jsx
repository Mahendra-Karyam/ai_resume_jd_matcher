import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";

// Same score-color logic used on the ScoreGauge component, kept in sync so a
// given score always reads the same color everywhere in the app.
const scoreColor = (score) => {
  if (score >= 85) return { text: "text-green-700", bg: "bg-green-100" };
  if (score >= 60) return { text: "text-blue-700", bg: "bg-blue-100" };
  if (score >= 35) return { text: "text-amber-700", bg: "bg-amber-100" };
  return { text: "text-red-700", bg: "bg-red-100" };
};

const formatDate = (isoString) => {
  const d = new Date(isoString);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

export default function MatchHistory() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    api
      .get("/matches")
      .then((res) => setMatches(res.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load match history"))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id, e) => {
    e.preventDefault(); // don't navigate via the wrapping <Link>
    e.stopPropagation();
    if (!window.confirm("Delete this match result? This can't be undone.")) return;

    setDeletingId(id);
    setError("");
    try {
      await api.delete(`/matches/${id}`);
      setMatches((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete match");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Match History</h1>
        <Link
          to="/dashboard"
          className="text-sm text-brand-600 hover:text-brand-700 font-medium"
        >
          + New Match
        </Link>
      </div>

      {loading && <p className="text-gray-400 text-sm">Loading your match history…</p>}

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {!loading && matches.length === 0 && (
        <div className="text-center border border-dashed border-gray-300 rounded-xl py-16 px-6">
          <p className="text-gray-500 mb-3">You haven't run any matches yet.</p>
          <Link
            to="/dashboard"
            className="inline-block bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg"
          >
            Run your first match
          </Link>
        </div>
      )}

      {!loading && matches.length > 0 && (
        <ul className="space-y-2">
          {matches.map((m) => {
            const colors = scoreColor(m.matchScore);
            const isDeleting = deletingId === m._id;

            return (
              <li key={m._id}>
                <Link
                  to={`/matches/${m._id}`}
                  className={`group flex items-center justify-between gap-4 bg-white border border-gray-200 rounded-lg px-4 py-3
                    hover:border-brand-300 hover:shadow-sm transition-colors
                    ${isDeleting ? "opacity-40 pointer-events-none" : ""}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {m.job?.title || "Untitled role"}
                      {m.job?.company && (
                        <span className="text-gray-400 font-normal"> @ {m.job.company}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {m.resume?.fileName || "Resume"} · {formatDate(m.createdAt)}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${colors.bg} ${colors.text}`}
                  >
                    {m.matchScore}%
                  </span>

                  <button
                    onClick={(e) => handleDelete(m._id, e)}
                    disabled={isDeleting}
                    title="Delete match"
                    className="shrink-0 text-gray-300 opacity-0 group-hover:opacity-100
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
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios.js";
import ScoreGauge from "../components/ScoreGauge.jsx";
import SkillGapChart from "../components/SkillGapChart.jsx";

export default function MatchResult() {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/matches/${id}`)
      .then((res) => setMatch(res.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load match"));
  }, [id]);

  if (error) return <p className="text-center text-red-500 mt-10">{error}</p>;
  if (!match) return <p className="text-center text-gray-400 mt-10">Loading…</p>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link to="/dashboard" className="text-sm text-brand-600">&larr; Back to Dashboard</Link>

      <div className="bg-white border border-gray-200 rounded-xl p-8 mt-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">{match.job?.title}</h1>
            {match.job?.company && <p className="text-gray-500 text-sm">{match.job.company}</p>}
            <p className="text-gray-400 text-xs mt-1">Resume: {match.resume?.fileName}</p>
          </div>
        </div>

        <div className="flex justify-center my-6">
          <ScoreGauge score={match.matchScore} />
        </div>

        <p className="text-gray-700 text-center mb-8">{match.summary}</p>

        <SkillGapChart matchedSkills={match.matchedSkills} missingSkills={match.missingSkills} />

        <div className="mt-8">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">💡 Suggestions to improve your fit</h4>
          <ul className="space-y-2">
            {match.suggestions?.map((s, i) => (
              <li key={i} className="text-sm bg-brand-50 text-brand-800 rounded-md px-3 py-2">
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

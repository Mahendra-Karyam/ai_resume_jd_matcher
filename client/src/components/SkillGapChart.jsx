import React from "react";

export default function SkillGapChart({ matchedSkills = [], missingSkills = [] }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h4 className="text-sm font-semibold text-green-700 mb-2">✓ Matched Skills</h4>
        <div className="flex flex-wrap gap-1.5">
          {matchedSkills.length === 0 && <span className="text-xs text-gray-400">None found</span>}
          {matchedSkills.map((skill, i) => (
            <span
              key={i}
              className="text-xs leading-snug bg-green-100 text-green-800 px-2.5 py-1.5 rounded-lg max-w-full"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-red-700 mb-2">✗ Missing Skills</h4>
        <div className="flex flex-wrap gap-1.5">
          {missingSkills.length === 0 && <span className="text-xs text-gray-400">None — great fit!</span>}
          {missingSkills.map((skill, i) => (
            <span
              key={i}
              className="text-xs leading-snug bg-red-100 text-red-800 px-2.5 py-1.5 rounded-lg max-w-full"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
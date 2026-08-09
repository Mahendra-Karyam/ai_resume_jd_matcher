import React from "react";
import { PieChart, Pie, Cell } from "recharts";

export default function ScoreGauge({ score }) {
  const color = score >= 85 ? "#16a34a" : score >= 60 ? "#2563eb" : score >= 35 ? "#f59e0b" : "#dc2626";
  const data = [
    { name: "score", value: score },
    { name: "rest", value: 100 - score },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center">
      <PieChart width={200} height={120}>
        <Pie
          data={data}
          cx={100}
          cy={100}
          startAngle={180}
          endAngle={0}
          innerRadius={70}
          outerRadius={95}
          dataKey="value"
          stroke="none"
        >
          <Cell fill={color} />
          <Cell fill="#e5e7eb" />
        </Pie>
      </PieChart>
      <div className="absolute top-14 text-center">
        <div className="text-3xl font-bold" style={{ color }}>{score}%</div>
        <div className="text-xs text-gray-400">Match Score</div>
      </div>
    </div>
  );
}

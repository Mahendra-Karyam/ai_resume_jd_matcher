import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="max-w-3xl mx-auto text-center py-20 px-4">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Match your resume to any job — instantly.
      </h1>
      <p className="text-gray-500 text-lg mb-8">
        Upload your resume, paste a job description, and get an AI-powered match score,
        skill gap analysis, and tailored suggestions in seconds.
      </p>
      <Link
        to={user ? "/dashboard" : "/register"}
        className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-medium px-6 py-3 rounded-lg"
      >
        {user ? "Go to Dashboard" : "Get Started Free"}
      </Link>
    </div>
  );
}

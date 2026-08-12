import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 sm:px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 leading-snug sm:leading-tight">
          Match your resume<br className="sm:hidden" />{" "}
          <span className="whitespace-nowrap">to any job — instantly.</span>
        </h1>
        <p className="text-gray-500 text-sm sm:text-lg mb-6 sm:mb-8 leading-relaxed">
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
    </div>
  );
}
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios.js";

export default function ForgotPassword() {
  const [form, setForm] = useState({ email: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", {
        email: form.email,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      setSuccess(data.message || "Password updated successfully.");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-16 px-4">
      <h2 className="text-2xl font-bold mb-6 text-center">Reset your password</h2>
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <input
          type="email" name="email" placeholder="Email" required
          value={form.email} onChange={handleChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <input
          type="password" name="newPassword" placeholder="New password" required
          minLength={6}
          value={form.newPassword} onChange={handleChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <input
          type="password" name="confirmPassword" placeholder="Confirm new password" required
          minLength={6}
          value={form.confirmPassword} onChange={handleChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}
        <button
          type="submit" disabled={loading}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-md py-2 font-medium"
        >
          {loading ? "Updating…" : "Reset Password"}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-4">
        Remembered your password? <Link to="/login" className="text-brand-600">Log in</Link>
      </p>
    </div>
  );
}

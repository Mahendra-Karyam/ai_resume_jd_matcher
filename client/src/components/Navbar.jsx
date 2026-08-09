import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  const handleLogout = () => {
    logout();
    setAccountOpen(false);
    navigate("/login");
  };

  // Close the account dropdown when clicking outside of it.
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16 gap-3">
        <Link to="/" onClick={() => setAccountOpen(false)} className="font-bold text-lg text-brand-700 shrink-0">
          Resume<span className="text-gray-900">Matcher</span>
        </Link>

        {user ? (
          // Single account button — works identically at every screen size.
          // Avatar circle always shows; the name text is hidden on small screens
          // to save space, leaving just the "U" initial as the tap target.
          <div ref={accountRef} className="relative shrink-0">
            <button
              onClick={() => setAccountOpen((prev) => !prev)}
              className={`flex items-center justify-center h-9 w-9 rounded-full border transition-colors
                ${accountOpen ? "border-brand-300 bg-brand-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
              title={user.name}
            >
              <span className="flex items-center justify-center h-7 w-7 rounded-full bg-brand-600 text-white text-xs font-semibold">
                {user.name?.charAt(0).toUpperCase()}
              </span>
            </button>

            {accountOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl ring-1 ring-black/5 py-1 text-sm">
                <div className="px-4 py-2 text-gray-500 border-b border-gray-100 truncate">
                  {user.name}
                </div>
                <Link
                  to="/dashboard"
                  onClick={() => setAccountOpen(false)}
                  className="block px-4 py-2 text-gray-600 hover:bg-brand-50 hover:text-brand-700"
                >
                  Dashboard
                </Link>
                <Link
                  to="/history"
                  onClick={() => setAccountOpen(false)}
                  className="block px-4 py-2 text-gray-600 hover:bg-brand-50 hover:text-brand-700"
                >
                  History
                </Link>
                <div className="my-1 border-t border-gray-100" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 sm:gap-6 text-sm shrink-0">
            <Link to="/login" className="hover:text-brand-600">Login</Link>
            <Link
              to="/register"
              className="px-3 py-1.5 rounded-md bg-brand-600 text-white hover:bg-brand-700"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
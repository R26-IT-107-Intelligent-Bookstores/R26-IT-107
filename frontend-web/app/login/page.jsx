"use client";
import { getApiUrl } from "../../lib/apiConfig"; 
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${getApiUrl()}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username, password }),
});

      const data = await res.json();

      // Ensure response is valid and check login success
      if (res.ok && data.success) {
        localStorage.setItem("userRole", data.role);
        localStorage.setItem("username", data.username);

        // Redirect both system roles securely to the home page route
        router.push("/"); 
      } else {
        setError(data.detail || "Login failed. Try again.");
      }
    } catch (err) {
      setError("Cannot connect to PhonoLex Python API.");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 font-sans px-4">
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-lg border border-gray-100 w-full max-w-md text-center">
        <h2 className="text-2xl md:text-3xl font-extrabold text-teal-900 mb-6">Sign In to Bookstore</h2>
        
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 font-semibold">{error}</div>}
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Username</label>
            <input 
              type="text" 
              placeholder="e.g., admin or nirmani" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full mt-1 p-3 rounded-xl border border-gray-200 text-gray-800 text-sm focus:outline-none focus:border-teal-700 focus:ring-1 focus:ring-teal-700 transition-all"
              required 
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 p-3 rounded-xl border border-gray-200 text-gray-800 text-sm focus:outline-none focus:border-teal-700 focus:ring-1 focus:ring-teal-700 transition-all"
              required 
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-3.5 rounded-full transition-colors shadow-md mt-2 cursor-pointer"
          >
            Login
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-500">
          Don't have an account?{" "}
          <Link href="/signup" className="text-teal-700 font-bold hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
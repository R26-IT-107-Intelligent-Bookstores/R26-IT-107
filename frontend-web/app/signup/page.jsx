"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // 1️⃣ Re-enter password සඳහා අලුත් state එකක්
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    // 2️⃣ Passwords දෙක සමානද කියලා චෙක් කිරීම (Validation)
    if (password !== confirmPassword) {
      setIsError(true);
      setMessage("Passwords do not match! Please check again.");
      return; // සමාන නැත්නම් මෙතනින්ම නවත්වනවා (API call එකට යන්නේ නෑ)
    }

    try {
      const res = await fetch("http://localhost:8000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 3️⃣ Dropdown එක නැති නිසා, සාමාන්‍ය කස්ටමර් කෙනෙක් ලෙස role: "user" යවයි
        body: JSON.stringify({ username, password, role: "user" }), 
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setMessage("Registration successful! Redirecting to login...");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setIsError(true);
        setMessage(data.detail || "Registration failed");
      }
    } catch (err) {
      setIsError(true);
      setMessage("Cannot connect to PhonoLex Python API.");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 font-sans px-4">
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-lg border border-gray-100 w-full max-w-md text-center">
        <h2 className="text-2xl md:text-3xl font-extrabold text-teal-900 mb-6">Create Account</h2>
        
        {message && (
          <div className={`text-sm p-3 rounded-lg mb-4 font-semibold ${isError ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
            {message}
          </div>
        )}
        
        <form onSubmit={handleSignUp} className="flex flex-col gap-4 text-left">
          {/* Username Field */}
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Username</label>
            <input 
              type="text" 
              placeholder="Choose a username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              className="w-full mt-1 p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-teal-700" 
              required 
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Password</label>
            <input 
              type="password" 
              placeholder="Create a password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full mt-1 p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-teal-700" 
              required 
            />
          </div>
          
          {/* 4️⃣ අලුත් Re-enter Password Field එක (Role Dropdown එක වෙනුවට) */}
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Re-enter Password</label>
            <input 
              type="password" 
              placeholder="Confirm your password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              className="w-full mt-1 p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-teal-700" 
              required 
            />
          </div>
          
          <button type="submit" className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-3.5 rounded-full transition-colors shadow-md mt-2 cursor-pointer">
            Register
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-teal-700 font-bold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
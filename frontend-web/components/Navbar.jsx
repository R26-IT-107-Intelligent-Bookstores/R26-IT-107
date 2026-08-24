"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function Navbar() {
  // State to hold the logged-in user's role privilege
  const [userRole, setUserRole] = useState(null);

  // Fetch the user role from browser localStorage once the component mounts on client side
  useEffect(() => {
    
    let role = localStorage.getItem("userRole");

    
    if (!role) {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          role = userObj.role || userObj.userRole;
        } catch (e) {
          console.error("Error parsing user object:", e);
        }
      }
    }

    
    if (role) {
      setUserRole(role.toLowerCase());
    }
  }, []);

  return (
    <nav style={styles.nav}>
      <div style={styles.leftGroup}>
        <Link href="/" style={styles.homeLink}>
          <span style={styles.homeIcon}>📖</span>
          <span style={styles.homeText}>Intelligent Bookstore</span>
        </Link>
        <span style={styles.divider}>|</span>
        <h2 style={styles.logo}>TrendStock</h2>
      </div>

      <div style={styles.links}>
        {/* Core Dashboard route available to all authenticated system accounts */}
        <Link style={styles.link} href="/trendstock">Dashboard</Link>
        
        {/* Protected analytical management routes visible exclusively to System Admins */}
        {userRole === "admin" && (
          <>
            <Link style={styles.link} href="/books">Books</Link>
            <Link style={styles.link} href="/branches">Branches</Link>
            <Link style={styles.link} href="/inventory">Inventory</Link>
            <Link style={styles.link} href="/sales">Sales</Link>
          </>
        )}
      </div>
    </nav>
  );
}

// Retaining all original inline styling parameters set by the teammate
const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 40px",
    background: "#042f2e",
    color: "white",
    fontFamily: '"Inter", "Arial", sans-serif',
  },
  leftGroup: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  homeLink: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "white",
    textDecoration: "none",
    opacity: 0.9,
    fontSize: "14px",
    fontWeight: "600",
  },
  homeIcon: {
    fontSize: "18px",
  },
  homeText: {
    display: "inline-block",
  },
  divider: {
    opacity: 0.3,
    fontWeight: "300",
  },
  logo: {
    margin: 0,
    fontWeight: "800",
  },
  links: {
    display: "flex",
    gap: "24px",
  },
  link: {
    color: "white",
    textDecoration: "none",
    fontWeight: "600",
  },
};
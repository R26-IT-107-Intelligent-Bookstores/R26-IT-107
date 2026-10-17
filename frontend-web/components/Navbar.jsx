"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  // State to hold the logged-in user's role privilege
  const [userRole, setUserRole] = useState(null);
  const pathname = usePathname();
  const isEmoBooksAdmin = pathname.startsWith("/admin/emobooks");

  // Fetch the user role from browser localStorage once the component mounts on client side
  useEffect(() => {
    queueMicrotask(() => {
    
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
    });
  }, []);

  return (
    <nav style={styles.nav} className="flex-wrap gap-4 !px-5 sm:!px-10" aria-label="Admin navigation">
      <div style={styles.leftGroup} className="min-w-0 flex-wrap">
        <Link href="/" style={styles.homeLink}>
          <span style={styles.homeIcon}>📖</span>
          <span style={styles.homeText}>Intelligent Bookstore</span>
        </Link>
        <span style={styles.divider}>|</span>
        <h2 style={styles.logo}>{isEmoBooksAdmin ? "EmoBooks Admin" : "TrendStock"}</h2>
      </div>

      <div style={styles.links} className="max-w-full flex-wrap">
        {/* Entire TrendStock section (Dashboard + branch pages) is
            admin-only, so this link is also gated the same as the
            other management routes below. */}
        {userRole === "admin" && (
          <>
            <Link style={styles.link} href={isEmoBooksAdmin ? "/admin/emobooks" : "/trendstock"}>Dashboard</Link>
            {isEmoBooksAdmin && <Link style={styles.link} href="/trendstock">TrendStock</Link>}
            <Link style={styles.link} href="/books">Books</Link>
            <Link style={styles.link} href="/branches">Branches</Link>
            <Link style={styles.link} href="/inventory">Inventory</Link>
            <Link style={{ ...styles.link, ...(isEmoBooksAdmin ? { color: "#f5d996", textDecoration: "underline", textUnderlineOffset: "6px" } : {}) }} href="/admin/emobooks" aria-current={isEmoBooksAdmin ? "page" : undefined}>EmoBooks</Link>
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

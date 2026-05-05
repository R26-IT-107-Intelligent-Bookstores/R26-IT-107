import Link from "next/link";

export default function Navbar() {
  return (
    <nav style={styles.nav}>
      <h2 style={styles.logo}>TrendStock</h2>

      <div style={styles.links}>
        <Link style={styles.link} href="/trendstock">Dashboard</Link>
        <Link style={styles.link} href="/books">Books</Link>
        <Link style={styles.link} href="/branches">Branches</Link>
        <Link style={styles.link} href="/inventory">Inventory</Link>
        <Link style={styles.link} href="/sales">Sales</Link>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 40px",
    background: "#1e3a8a",
    color: "white",
    fontFamily: "Arial, sans-serif",
  },
  logo: {
    margin: 0,
  },
  links: {
    display: "flex",
    gap: "24px",
  },
  link: {
    color: "white",
    textDecoration: "none",
    fontWeight: "bold",
  },
};
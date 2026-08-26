// Simple role-check middleware.
// The frontend sends the logged-in user's role in the "x-user-role" header
// (read from localStorage after login). This middleware blocks access to
// admin-only management routes if that header isn't "admin".
//
// Note: this is a lightweight guard, not a cryptographic token — a
// determined user could still fake the header. A production system would
// upgrade this to a signed JWT issued at login. Given this project's
// login/auth lives in a separate service (PhonoLex's Python backend),
// this header-check approach is the practical first layer of server-side
// enforcement without requiring changes to that service.

const requireAdmin = (req, res, next) => {
    const role = (req.headers["x-user-role"] || "").toLowerCase();
  
    if (role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Access denied: admin role required",
      });
    }
  
    next();
  };
  
  module.exports = { requireAdmin };
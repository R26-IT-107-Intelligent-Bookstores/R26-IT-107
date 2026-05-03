const express = require("express");
const connectDB = require("./config/db");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("TrendStock API is running 🚀");
});

// Routes
app.use("/api/books", require("./routes/bookRoutes"));
app.use("/api/branches", require("./routes/branchRoutes"));
app.use("/api/inventory", require("./routes/inventoryRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/sales", require("./routes/salesRoutes"));
app.use("/api/trends", require("./routes/trendRoutes")); // ✅ includes BOTH old + novelty

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
const express = require("express");
const connectDB = require("./config/db");

const app = express();

// connect to database
connectDB();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("TrendStock API is running 🚀");
});

const PORT = 5000;

app.use("/api/books", require("./routes/bookRoutes"));
app.use("/api/branches", require("./routes/branchRoutes"));
app.use("/api/inventory", require("./routes/inventoryRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/sales", require("./routes/salesRoutes"));
app.use("/api/trends", require("./routes/trendRoutes"));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const authRoutes = require("./routes/authRoutes");
const routeRoutes = require("./routes/routeRoutes");
const busRoutes = require("./routes/busRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const predictionRoutes = require("./routes/predictionRoutes");
const userRoutes = require("./routes/userRoutes");
const roleRoutes = require("./routes/roleRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const busAllocationRoutes = require("./routes/busAllocationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

// Environment variables for microservices
process.env.NLP_SERVICE_URL =
  process.env.NLP_SERVICE_URL || "http://localhost:5002";
process.env.PYTHON_API_URL =
  process.env.PYTHON_API_URL || "http://localhost:5001";

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/predictions", predictionRoutes);
app.use("/api/users", userRoutes);
app.use("/api", roleRoutes); // /api/roles and /api/permissions
app.use("/api/assignments", assignmentRoutes);
app.use("/api/bus-allocation", busAllocationRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.send("SLTB Admin Dashboard API is running");
});

// Centralized Error Handler (should be after all routes)
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

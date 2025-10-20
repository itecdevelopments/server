const express = require("express");
const connectDB = require("./server");
require("dotenv").config();
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const cors = require("cors");

// Routers
const serviceReportRoutes = require("./routers/formRouter");
const customerRoutes = require("./routers/customerRouter");
const spareRoutes = require("./routers/sparePartsRouter");
const userRouter = require("./routers/userRouter");

// Error utilities
const AppError = require("./utils/appError");
const globalErrorHandler = require("./utils/globalErrorHandler");

const app = express();

/* -------------------------- Database Connection -------------------------- */
connectDB()
  .then(() => console.log("✅ Database connected successfully"))
  .catch((err) => {
    console.error("❌ DB Connection failed:", err);
    process.exit(1);
  });

/* ------------------------------- Middleware ------------------------------ */

// ✅ CORS (allow frontend access)
app.use(
  cors({
    origin: [
      // "https://itec-srv-sa.vercel.app/", // main deployed frontend
      "https://itec-srv-sa.vercel.app",
      "http://localhost:5173",       // optional for local dev
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Body parsers & sanitizers
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(xss());

// ✅ Logging
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ✅ Disable caching
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

/* --------------------------------- Routes -------------------------------- */
app.use("/api/v1/users", userRouter);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/spares", spareRoutes);
app.use("/api/v1", serviceReportRoutes);

/* ------------------------------ 404 Handling ----------------------------- */
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

/* --------------------------- Global Error Handler ------------------------ */
app.use(globalErrorHandler);

/* ------------------------------- Server Run ------------------------------ */
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Server running locally on http://localhost:${PORT}`);
  });
}

module.exports = app;

import express from "express";
import cors from "cors";
import emailRoutes from "./routes/email.routes.js";
import authRoutes from "./routes/auth.routes.js";
import passport from "./config/google.js";
import session from "express-session";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "reachinbox-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "ReachInbox API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/emails", emailRoutes);

export default app;

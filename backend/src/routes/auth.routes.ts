import { Router } from "express";
import passport from "../config/google.js";
import { prisma } from "../config/database.js";
import { slackClientId, slackClientSecret } from "../config/slack.js";
import { WebClient } from "@slack/web-api";

const router = Router();

/* =========================
   Google OAuth
========================= */

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:5173/login",
  }),
  (_req, res) => {
    res.redirect("http://localhost:5173/");
  },
);

/* =========================
   Current User
========================= */

router.get("/me", (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Not authenticated",
    });
  }

  return res.json({
    user: req.user,
  });
});

/* =========================
   Slack OAuth
========================= */

router.get("/slack", (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      message: "You must be logged in with Google first",
    });
  }

  const state = String((req.user as any).id);

  const params = new URLSearchParams({
    client_id: slackClientId,
    scope: "chat:write",
    redirect_uri: process.env.SLACK_REDIRECT_URI!,
    state,
  });

  res.redirect(
    `https://slack.com/oauth/v2/authorize?${params.toString()}`,
  );
});

router.get("/slack/callback", async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({
        message: "Missing Slack OAuth code or state",
      });
    }

    const userId = String(state);

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    const slackClient = new WebClient();

    const oauthResponse = await slackClient.oauth.v2.access({
      client_id: slackClientId,
      client_secret: slackClientSecret,
      code: String(code),
      redirect_uri: process.env.SLACK_REDIRECT_URI!,
    });

    if (!oauthResponse.ok || !oauthResponse.access_token) {
      throw new Error("Slack OAuth authorization failed");
    }

    await prisma.slackConnection.upsert({
      where: {
        userId,
      },
      update: {
        accessToken: oauthResponse.access_token,
        teamId: oauthResponse.team?.id ?? null,
        teamName: oauthResponse.team?.name ?? null,
        slackUserId: oauthResponse.authed_user?.id ?? null,
      },
      create: {
        userId,
        accessToken: oauthResponse.access_token,
        teamId: oauthResponse.team?.id ?? null,
        teamName: oauthResponse.team?.name ?? null,
        slackUserId: oauthResponse.authed_user?.id ?? null,
      },
    });

    res.redirect("http://localhost:5173/");
  } catch (error) {
    console.error("Slack OAuth error:", error);

    res.redirect("http://localhost:5173/?slack=error");
  }
});

/* =========================
   Slack Connection Status
========================= */

router.get("/slack/status", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    const userId = (req.user as any).id;

    const connection = await prisma.slackConnection.findUnique({
      where: {
        userId,
      },
      select: {
        teamId: true,
        teamName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json({
      connected: Boolean(connection),
      connection,
    });
  } catch (error) {
    console.error("Failed to check Slack status:", error);

    return res.status(500).json({
      message: "Failed to check Slack connection",
    });
  }
});

/* =========================
   Slack Disconnect
========================= */

router.delete("/slack", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    const userId = (req.user as any).id;

    await prisma.slackConnection.deleteMany({
      where: {
        userId,
      },
    });

    return res.json({
      message: "Slack disconnected successfully",
    });
  } catch (error) {
    console.error("Failed to disconnect Slack:", error);

    return res.status(500).json({
      message: "Failed to disconnect Slack",
    });
  }
});

/* =========================
   Logout
========================= */

router.get("/logout", (req, res) => {
  req.logout((error) => {
    if (error) {
      return res.status(500).json({
        message: "Logout failed",
      });
    }

    req.session.destroy((sessionError) => {
      if (sessionError) {
        return res.status(500).json({
          message: "Failed to destroy session",
        });
      }

      res.clearCookie("connect.sid");

      return res.json({
        message: "Logged out successfully",
      });
    });
  });
});

export default router;
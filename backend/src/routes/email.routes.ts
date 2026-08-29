import { Router } from "express";
import { prisma } from "../config/database.js";
import { scheduleEmails } from "../services/email.service.js";
import { searchEmails } from "../services/elasticsearch.service.js";

const router = Router();

router.post("/schedule", async (req, res) => {
  try {
    const {
      userId,
      senderEmail,
      senderName,
      subject,
      body,
      recipients,
      startTime,
      delayMs,
      hourlyLimit,
    } = req.body;

    if (
      !userId ||
      !senderEmail ||
      !subject ||
      !body ||
      !Array.isArray(recipients) ||
      !startTime
    ) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const result = await scheduleEmails({
      userId,
      senderEmail,
      senderName,
      subject,
      body,
      recipients,
      startTime,
      delayMs: Number(delayMs),
      hourlyLimit: Number(hourlyLimit),
    });

    return res.status(201).json({
      message: "Emails scheduled successfully",
      campaignId: result.campaign.id,
      emails: result.emails,
    });
  } catch (error) {
    console.error("Schedule email error:", error);

    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "Failed to schedule emails",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const status = String(req.query.status || "").trim();

    const emails = await prisma.email.findMany({
      where: status
        ? {
            status: status as any,
          }
        : undefined,
      orderBy: {
        scheduledAt: "asc",
      },
    });

    return res.json({
      count: emails.length,
      emails,
    });
  } catch (error) {
    console.error("Failed to fetch emails:", error);

    return res.status(500).json({
      message: "Failed to fetch emails",
    });
  }
});

router.get("/search", async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();

    if (!query) {
      return res.status(400).json({
        message: "Search query is required",
      });
    }

    const emails = await searchEmails(query);

    return res.json({
      query,
      count: emails.length,
      emails,
    });
  } catch (error) {
    console.error("Email search failed:", error);

    return res.status(500).json({
      message: "Failed to search emails",
    });
  }
});

router.get("/scheduled", async (req, res) => {
  try {
    const userId = String(req.query.userId || "").trim();

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    const emails = await prisma.email.findMany({
      where: {
        campaign: {
          userId,
        },
        status: "SCHEDULED",
      },
      orderBy: {
        scheduledAt: "asc",
      },
    });

    return res.json({
      emails,
    });
  } catch (error) {
    console.error("Failed to fetch scheduled emails:", error);

    return res.status(500).json({
      message: "Failed to fetch scheduled emails",
    });
  }
});

router.get("/sent", async (req, res) => {
  try {
    const userId = String(req.query.userId || "").trim();

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    const emails = await prisma.email.findMany({
      where: {
        campaign: {
          userId,
        },
        status: {
          in: ["SENT", "FAILED"],
        },
      },
      orderBy: {
        sentAt: "desc",
      },
    });

    return res.json({
      emails,
    });
  } catch (error) {
    console.error("Failed to fetch sent emails:", error);

    return res.status(500).json({
      message: "Failed to fetch sent emails",
    });
  }
});

export default router;

import "dotenv/config";

import { Worker, Job } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { prisma } from "../config/database.js";
import { sendEmail } from "../services/mail.service.js";
import {
  acquireSendSlot,
  claimRateLimitNotification,
  consumeHourlySlot,
} from "../services/rate-limit.service.js";
import { indexEmail } from "../services/elasticsearch.service.js";
import { sendSlackMessage } from "../services/slack.service.js";

interface EmailJobData {
  emailId: string;
}

class RateLimitError extends Error {
  constructor(public retryAfterMs: number) {
    super(`RATE_LIMIT:${retryAfterMs}`);
    this.name = "RateLimitError";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const worker = new Worker<EmailJobData>(
  "email-queue",

  async (job: Job<EmailJobData>) => {
    console.log("Processing email job:", job.id);

    const email = await prisma.email.findUnique({
      where: {
        id: job.data.emailId,
      },
      include: {
        campaign: true,
      },
    });

    if (!email) {
      throw new Error(`Email not found: ${job.data.emailId}`);
    }

    // Idempotency:
    // If the email has already been sent, never send it again.
    if (email.status === "SENT") {
      console.log(
        `Email ${email.id} has already been sent. Skipping.`,
      );

      return;
    }

    // ---------------------------------------------------------
    // HOURLY RATE LIMIT
    // ---------------------------------------------------------

    const rateLimit = await consumeHourlySlot();

    if (!rateLimit.allowed) {
      console.log(
        `Hourly rate limit reached for job ${job.id}.`,
      );

      console.log(
        `Retrying after ${Math.ceil(
          rateLimit.retryAfterMs / 1000,
        )} seconds.`,
      );

      // Only one worker should send the Slack notification
      // for this hourly rate-limit window.
      const shouldNotify =
        await claimRateLimitNotification();

      if (shouldNotify) {
        try {
          await sendSlackMessage(
            email.campaign.userId,
            `⚠️ Email hourly rate limit reached\n\n` +
              `Campaign: ${email.campaign.subject}\n` +
              `Limit: ${
                Number(process.env.MAX_EMAILS_PER_HOUR) || 200
              } emails/hour\n` +
              `The remaining emails will continue in the next hour.`,
          );

          console.log(
            "Slack rate-limit notification sent.",
          );
        } catch (slackError) {
          console.error(
            "Failed to send Slack rate-limit notification:",
            slackError,
          );
        }
      }

      // Throwing causes BullMQ to retry the same job.
      // The job is not deleted or permanently failed.
      throw new RateLimitError(rateLimit.retryAfterMs);
    }

    // ---------------------------------------------------------
    // ACTUAL SEND SPACING
    // ---------------------------------------------------------

    const waitMs = await acquireSendSlot();

    if (waitMs > 0) {
      console.log(
        `Waiting ${waitMs}ms before sending ${email.id}`,
      );

      await sleep(waitMs);
    }

    // ---------------------------------------------------------
    // MARK AS PROCESSING
    // ---------------------------------------------------------

    await prisma.email.update({
      where: {
        id: email.id,
      },
      data: {
        status: "PROCESSING",
      },
    });

    try {
      console.log(
        "Sending email to:",
        email.recipient,
      );

      const info = await sendEmail({
        to: email.recipient,
        subject: email.subject,
        body: email.body,
      });

      // -------------------------------------------------------
      // MARK AS SENT
      // -------------------------------------------------------

      const updatedEmail = await prisma.email.update({
        where: {
          id: email.id,
        },
        data: {
          status: "SENT",
          sentAt: new Date(),
          messageId: info.messageId,
          error: null,
        },
      });

      await indexEmail(updatedEmail);

      // -------------------------------------------------------
      // SLACK SUCCESS NOTIFICATION
      // -------------------------------------------------------

      try {
        await sendSlackMessage(
          email.campaign.userId,
          `✅ Email sent successfully\n\n` +
            `Recipient: ${email.recipient}\n` +
            `Subject: ${email.subject}\n` +
            `Message ID: ${info.messageId}`,
        );
      } catch (slackError) {
        console.error(
          "Failed to send Slack notification:",
          slackError,
        );
      }

      console.log(
        "Email sent successfully:",
        email.id,
      );

      return {
        emailId: email.id,
        status: "SENT",
        messageId: info.messageId,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown email sending error";

      const updatedEmail = await prisma.email.update({
        where: {
          id: email.id,
        },
        data: {
          status: "FAILED",
          error: errorMessage,
        },
      });

      await indexEmail(updatedEmail);

      try {
        await sendSlackMessage(
          email.campaign.userId,
          `❌ Email failed\n\n` +
            `Recipient: ${email.recipient}\n` +
            `Subject: ${email.subject}\n` +
            `Error: ${errorMessage}`,
        );
      } catch (slackError) {
        console.error(
          "Failed to send Slack notification:",
          slackError,
        );
      }

      console.error(
        `Email ${email.id} failed:`,
        errorMessage,
      );

      throw error;
    }
  },

  {
    connection: redisConnection,

    // Configurable worker concurrency.
    concurrency:
      Number(process.env.WORKER_CONCURRENCY) || 5,

    settings: {
      backoffStrategy: (
        _attemptsMade,
        _type,
        err,
      ) => {
        if (err?.message?.startsWith("RATE_LIMIT:")) {
          const retryAfterMs = Number(
            err.message.split(":")[1],
          );

          return retryAfterMs;
        }

        return 5000;
      },
    },
  },
);

worker.on("completed", (job) => {
  console.log(
    `Job ${job.id} completed`,
  );
});

worker.on("failed", (job, error) => {
  console.error(
    `Job ${job?.id} failed:`,
    error,
  );
});

console.log("Email worker started");
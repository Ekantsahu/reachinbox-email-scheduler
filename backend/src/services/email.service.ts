import { prisma } from "../config/database.js";
import { emailQueue } from "../queue/email.queue.js";
import { indexEmail } from "./elasticsearch.service.js";

interface ScheduleEmailInput {
  userId: string;
  senderEmail: string;
  senderName?: string;
  subject: string;
  body: string;
  recipients: string[];
  startTime: string;
  delayMs: number;
  hourlyLimit: number;
}

export async function scheduleEmails(input: ScheduleEmailInput) {
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
  } = input;

  const startDate = new Date(startTime);

  const minimumDelayMs = Number(process.env.MIN_EMAIL_DELAY_MS) || 2000;

  const actualDelayMs = Math.max(delayMs, minimumDelayMs);

  if (Number.isNaN(startDate.getTime())) {
    throw new Error("Invalid start time");
  }

  if (startDate.getTime() < Date.now()) {
    throw new Error("Start time must be in the future");
  }

  if (recipients.length === 0) {
    throw new Error("At least one recipient is required");
  }

  if (delayMs < 0) {
    throw new Error("Delay cannot be negative");
  }

  if (hourlyLimit <= 0) {
    throw new Error("Hourly limit must be greater than zero");
  }

  const sender = await prisma.sender.upsert({
    where: {
      userId_email: {
        userId,
        email: senderEmail,
      },
    },
    update: {
      name: senderName,
    },
    create: {
      userId,
      email: senderEmail,
      name: senderName,
    },
  });

  const campaign = await prisma.campaign.create({
    data: {
      userId,
      senderId: sender.id,
      subject,
      body,
      startTime: startDate,
      delayMs: actualDelayMs,
      hourlyLimit,
    },
  });

  const emails = recipients.map((recipient, index) => {
    const hourIndex = Math.floor(index / hourlyLimit);
    const positionInHour = index % hourlyLimit;

    const scheduledAt = new Date(
      startDate.getTime() +
        hourIndex * 60 * 60 * 1000 +
        positionInHour * actualDelayMs,
    );

    return {
      campaignId: campaign.id,
      senderId: sender.id,
      recipient: recipient.trim(),
      subject,
      body,
      scheduledAt,
    };
  });

  const createdEmails = await prisma.email.createManyAndReturn({
    data: emails,
  });

  await Promise.all(createdEmails.map((email) => indexEmail(email))); 

  await Promise.all(
    createdEmails.map((email) =>
      emailQueue.add(
        "send-email",
        {
          emailId: email.id,
        },
        {
          delay: Math.max(0, email.scheduledAt.getTime() - Date.now()),
          jobId: `email-${email.id}`,
          attempts: 1000,
          backoff: {
            type: "custom",
          },
        },
      ),
    ),
  );

  return {
    campaign,
    emails: createdEmails,
  };
}

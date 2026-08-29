import { WebClient } from "@slack/web-api";
import { prisma } from "../config/database.js";

export async function sendSlackMessage(
  userId: string,
  message: string,
) {
  const connection = await prisma.slackConnection.findUnique({
    where: {
      userId,
    },
  });

  // Slack is optional. If the user has not connected Slack,
  // simply skip the notification.
  if (!connection) {
    console.log(
      `Slack not connected for user ${userId}. Skipping notification.`,
    );

    return null;
  }

  try {
    const slack = new WebClient(connection.accessToken);

    if (!connection.slackUserId) {
      console.error(
        `Slack user ID missing for user ${userId}.`,
      );

      return null;
    }

    // Open a DM with the Slack user who connected the workspace.
    const conversation = await slack.conversations.open({
      users: connection.slackUserId,
    });

    const channelId = conversation.channel?.id;

    if (!channelId) {
      throw new Error("Unable to open Slack DM");
    }

    const result = await slack.chat.postMessage({
      channel: channelId,
      text: message,
    });

    return result;
  } catch (error) {
    console.error(
      `Failed to send Slack notification for user ${userId}:`,
      error,
    );

    // Slack failure must never break email processing.
    return null;
  }
}
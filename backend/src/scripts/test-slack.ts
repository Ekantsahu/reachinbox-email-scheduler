import "dotenv/config";
import { sendSlackMessage } from "../services/slack.service.js";

async function main() {
  try {
    await sendSlackMessage("cmteboqnb0000247bn908pcfz", "Test message");

    console.log("Slack message sent successfully");
  } catch (error) {
    console.error("Slack test failed:", error);
  }
}

main();

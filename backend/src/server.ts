import "dotenv/config";
import app from "./app.js";
import { prisma } from "./config/database.js";
import { createEmailIndex } from "./services/elasticsearch.service.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await prisma.$connect();

    console.log("Database connected successfully");

    createEmailIndex()
      .then(() => {
        app.listen(PORT, () => {
          console.log(`Server running on port ${PORT}`);
        });
      })
      .catch((error) => {
        console.error("Failed to initialize Elasticsearch:", error);
        process.exit(1);
      });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

startServer();

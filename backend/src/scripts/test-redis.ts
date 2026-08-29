import "dotenv/config";
import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL!);

try {
  const result = await redis.ping();
  console.log("Redis connection:", result);
} catch (error) {
  console.error("Redis connection failed:", error);
} finally {
  await redis.quit();
}
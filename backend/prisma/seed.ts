import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const user = await prisma.user.upsert({
    where: {
      email: "test@reachinbox.local",
    },
    update: {},
    create: {
      email: "test@reachinbox.local",
      name: "Test User",
    },
  });

  console.log("Test user created:");
  console.log(user);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
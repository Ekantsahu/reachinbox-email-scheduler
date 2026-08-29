import "dotenv/config";
import { prisma } from "../config/database.js";

const emails = await prisma.email.findMany({
  where: {
    id: {
      in: [
        "cmtdv9r26000gek7bzzazh81u",
        "cmtdv9r26000hek7bjdiammo6",
        "cmtdv9r26000iek7b14rk7ihq",
        "cmtdv9r26000jek7bb11vehje",
        "cmtdv9r26000kek7bkiq0cbqg",
      ],
    },
  },
  select: {
    id: true,
    recipient: true,
    subject: true,
    status: true,
    sentAt: true,
    messageId: true,
  },
});

console.table(emails);

await prisma.$disconnect();
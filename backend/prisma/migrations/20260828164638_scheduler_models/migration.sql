/*
  Warnings:

  - You are about to drop the column `attempts` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `bullJobId` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `avatar` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `googleId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `SlackConnection` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `senderId` to the `Campaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderId` to the `Email` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Campaign" DROP CONSTRAINT "Campaign_userId_fkey";

-- DropForeignKey
ALTER TABLE "Email" DROP CONSTRAINT "Email_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "Email" DROP CONSTRAINT "Email_userId_fkey";

-- DropForeignKey
ALTER TABLE "SlackConnection" DROP CONSTRAINT "SlackConnection_userId_fkey";

-- DropIndex
DROP INDEX "Campaign_userId_idx";

-- DropIndex
DROP INDEX "Email_bullJobId_key";

-- DropIndex
DROP INDEX "Email_userId_status_idx";

-- DropIndex
DROP INDEX "User_googleId_key";

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "senderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Email" DROP COLUMN "attempts",
DROP COLUMN "bullJobId",
DROP COLUMN "userId",
ADD COLUMN     "error" TEXT,
ADD COLUMN     "messageId" TEXT,
ADD COLUMN     "senderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "avatar",
DROP COLUMN "googleId",
ADD COLUMN     "avatarUrl" TEXT,
ALTER COLUMN "name" DROP NOT NULL;

-- DropTable
DROP TABLE "SlackConnection";

-- CreateTable
CREATE TABLE "Sender" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sender_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sender_userId_email_key" ON "Sender"("userId", "email");

-- CreateIndex
CREATE INDEX "Email_status_idx" ON "Email"("status");

-- AddForeignKey
ALTER TABLE "Sender" ADD CONSTRAINT "Sender_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Sender"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Sender"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

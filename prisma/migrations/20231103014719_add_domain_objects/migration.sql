-- CreateTable
CREATE TABLE "AtCoderAPIFetchLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "endpoint" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Problem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "offeredReward" BIGINT NOT NULL,
    "contractReward" BIGINT,
    "startContractUnixSeconds" BIGINT,
    "numStoryPoints" INTEGER NOT NULL,
    "storyPointsHistory" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Project_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "salary" BIGINT NOT NULL,
    "codingSkill" INTEGER NOT NULL,
    "communicationSkill" INTEGER NOT NULL,
    "projectManagementSkill" INTEGER NOT NULL,
    "isAssigned" BOOLEAN NOT NULL DEFAULT false,
    "isFired" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GameStatus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "money" BIGINT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    CONSTRAINT "GameStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "GameStatus_userId_key" ON "GameStatus"("userId");

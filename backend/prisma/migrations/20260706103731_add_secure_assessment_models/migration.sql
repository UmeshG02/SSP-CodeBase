-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';
ALTER TYPE "Role" ADD VALUE 'CONTENT_MANAGER';
ALTER TYPE "Role" ADD VALUE 'MODERATOR';
ALTER TYPE "Role" ADD VALUE 'SUPPORT_STAFF';

-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "dayId" TEXT;

-- AlterTable
ALTER TABLE "Profile" ALTER COLUMN "prefLang" SET DEFAULT 'Python';

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "autoSubmitReason" TEXT,
ADD COLUMN     "autoSubmitted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "LearningPath" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "LearningPath_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Week" (
    "id" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "accessKey" TEXT,

    CONSTRAINT "Week_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Day" (
    "id" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "objectives" TEXT[],

    CONSTRAINT "Day_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "currentWeek" INTEGER NOT NULL DEFAULT 1,
    "currentDay" INTEGER NOT NULL DEFAULT 1,
    "unlockedWeeks" INTEGER[],

    CONSTRAINT "UserProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDayProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "score" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserDayProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamConfig" (
    "id" TEXT NOT NULL,
    "maxViolations" INTEGER NOT NULL DEFAULT 3,
    "fullscreenEnabled" BOOLEAN NOT NULL DEFAULT true,
    "tabSwitchEnabled" BOOLEAN NOT NULL DEFAULT true,
    "copyPasteDisabled" BOOLEAN NOT NULL DEFAULT true,
    "rightClickDisabled" BOOLEAN NOT NULL DEFAULT true,
    "devToolsDisabled" BOOLEAN NOT NULL DEFAULT true,
    "resizeWarningsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoSaveEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoSaveInterval" INTEGER NOT NULL DEFAULT 15,
    "windowFocusDetection" BOOLEAN NOT NULL DEFAULT true,
    "enforceFullScreen" BOOLEAN NOT NULL DEFAULT true,
    "lockDurationMinutes" INTEGER NOT NULL DEFAULT 30,
    "availableLockDurations" INTEGER[] DEFAULT ARRAY[10, 15, 30, 60]::INTEGER[],
    "violationResetPolicy" TEXT NOT NULL DEFAULT 'AFTER_ASSESSMENT',
    "warningMsg1" TEXT NOT NULL DEFAULT 'Warning 1 of 3: You have left the exam window. Please return immediately.',
    "warningMsg2" TEXT NOT NULL DEFAULT 'Warning 2 of 3: One more violation will automatically submit your assessment.',
    "warningMsg3" TEXT NOT NULL DEFAULT 'Your assessment has been automatically submitted because the maximum number of security violations was reached.',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "violationCount" INTEGER NOT NULL DEFAULT 0,
    "maxViolations" INTEGER NOT NULL DEFAULT 3,
    "lockDuration" INTEGER NOT NULL DEFAULT 30,
    "lockedAt" TIMESTAMP(3),
    "unlocksAt" TIMESTAMP(3),
    "currentCode" TEXT,
    "currentLanguage" TEXT,
    "currentQuestion" INTEGER NOT NULL DEFAULT 0,
    "totalQuestions" INTEGER NOT NULL DEFAULT 1,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ViolationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "sessionId" TEXT,
    "violationType" TEXT NOT NULL,
    "details" TEXT,
    "totalCount" INTEGER NOT NULL,
    "browser" TEXT NOT NULL,
    "os" TEXT NOT NULL,
    "ipAddress" TEXT,
    "assessmentDuration" INTEGER,
    "remainingTime" INTEGER,
    "lockStatus" TEXT,
    "module" TEXT,
    "day" TEXT,
    "questionNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ViolationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LockHistory" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledUnlockAt" TIMESTAMP(3),
    "unlockedAt" TIMESTAMP(3),
    "unlockReason" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "createdBy" TEXT DEFAULT 'SYSTEM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LockHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoSave" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "language" TEXT,
    "questionNumber" INTEGER,
    "questionType" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutoSave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LearningPath_slug_key" ON "LearningPath"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "UserProgress_userId_pathId_key" ON "UserProgress"("userId", "pathId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDayProgress_userId_dayId_key" ON "UserDayProgress"("userId", "dayId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentSession_userId_problemId_status_key" ON "AssessmentSession"("userId", "problemId", "status");

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Week" ADD CONSTRAINT "Week_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "LearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Day" ADD CONSTRAINT "Day_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProgress" ADD CONSTRAINT "UserProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProgress" ADD CONSTRAINT "UserProgress_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "LearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDayProgress" ADD CONSTRAINT "UserDayProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDayProgress" ADD CONSTRAINT "UserDayProgress_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSession" ADD CONSTRAINT "AssessmentSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSession" ADD CONSTRAINT "AssessmentSession_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViolationLog" ADD CONSTRAINT "ViolationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViolationLog" ADD CONSTRAINT "ViolationLog_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViolationLog" ADD CONSTRAINT "ViolationLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LockHistory" ADD CONSTRAINT "LockHistory_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoSave" ADD CONSTRAINT "AutoSave_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

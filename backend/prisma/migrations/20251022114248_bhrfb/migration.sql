-- CreateEnum
CREATE TYPE "MockDriveStatus" AS ENUM ('DRAFT', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MockDriveRegistrationStatus" AS ENUM ('REGISTERED', 'BATCH_ASSIGNED', 'CANCELLED', 'DISQUALIFIED');

-- CreateEnum
CREATE TYPE "MockDriveAttemptStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED', 'DISQUALIFIED');

-- CreateTable
CREATE TABLE "mock_drives" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "institutionId" INTEGER NOT NULL,
    "eligibleYear" INTEGER[],
    "eligibilityCriteria" JSONB,
    "aptitudeTestId" INTEGER,
    "aiInterviewConfig" JSONB,
    "registrationStartDate" TIMESTAMP(3) NOT NULL,
    "registrationEndDate" TIMESTAMP(3) NOT NULL,
    "driveStartDate" TIMESTAMP(3) NOT NULL,
    "driveEndDate" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "rankingsPublished" BOOLEAN NOT NULL DEFAULT false,
    "status" "MockDriveStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "mock_drives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_drive_machine_problems" (
    "id" SERIAL NOT NULL,
    "mockDriveId" TEXT NOT NULL,
    "problemId" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 100,

    CONSTRAINT "mock_drive_machine_problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_drive_registrations" (
    "id" TEXT NOT NULL,
    "mockDriveId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "MockDriveRegistrationStatus" NOT NULL DEFAULT 'REGISTERED',

    CONSTRAINT "mock_drive_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_drive_batches" (
    "id" TEXT NOT NULL,
    "mockDriveId" TEXT NOT NULL,
    "batchName" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "maxStudents" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mock_drive_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_drive_batch_students" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mock_drive_batch_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_drive_attempts" (
    "id" TEXT NOT NULL,
    "mockDriveId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "batchId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" "MockDriveAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "aptitudeResponseId" INTEGER,
    "machineTestId" INTEGER,
    "aiInterviewSessionId" TEXT,

    CONSTRAINT "mock_drive_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_drive_results" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "mockDriveId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aptitudeScore" DECIMAL(5,2),
    "aptitudeMaxScore" DECIMAL(5,2),
    "machineTestScore" DECIMAL(5,2),
    "machineTestMaxScore" DECIMAL(5,2),
    "aiInterviewScore" DECIMAL(5,2),
    "aiInterviewMaxScore" DECIMAL(5,2),
    "totalScore" DECIMAL(5,2) NOT NULL,
    "totalMaxScore" DECIMAL(5,2) NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "detailedReport" JSONB,
    "strengths" TEXT[],
    "areasForImprovement" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mock_drive_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_drive_rankings" (
    "id" TEXT NOT NULL,
    "mockDriveId" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "percentile" DECIMAL(5,2) NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mock_drive_rankings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mock_drives_institutionId_status_isPublished_idx" ON "mock_drives"("institutionId", "status", "isPublished");

-- CreateIndex
CREATE INDEX "mock_drives_driveStartDate_driveEndDate_idx" ON "mock_drives"("driveStartDate", "driveEndDate");

-- CreateIndex
CREATE INDEX "mock_drive_machine_problems_mockDriveId_orderIndex_idx" ON "mock_drive_machine_problems"("mockDriveId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "mock_drive_machine_problems_mockDriveId_problemId_key" ON "mock_drive_machine_problems"("mockDriveId", "problemId");

-- CreateIndex
CREATE INDEX "mock_drive_registrations_mockDriveId_status_idx" ON "mock_drive_registrations"("mockDriveId", "status");

-- CreateIndex
CREATE INDEX "mock_drive_registrations_userId_status_idx" ON "mock_drive_registrations"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "mock_drive_registrations_mockDriveId_userId_key" ON "mock_drive_registrations"("mockDriveId", "userId");

-- CreateIndex
CREATE INDEX "mock_drive_batches_mockDriveId_startTime_endTime_idx" ON "mock_drive_batches"("mockDriveId", "startTime", "endTime");

-- CreateIndex
CREATE UNIQUE INDEX "mock_drive_batches_mockDriveId_batchName_key" ON "mock_drive_batches"("mockDriveId", "batchName");

-- CreateIndex
CREATE UNIQUE INDEX "mock_drive_batch_students_registrationId_key" ON "mock_drive_batch_students"("registrationId");

-- CreateIndex
CREATE INDEX "mock_drive_batch_students_batchId_idx" ON "mock_drive_batch_students"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "mock_drive_batch_students_batchId_registrationId_key" ON "mock_drive_batch_students"("batchId", "registrationId");

-- CreateIndex
CREATE UNIQUE INDEX "mock_drive_attempts_aptitudeResponseId_key" ON "mock_drive_attempts"("aptitudeResponseId");

-- CreateIndex
CREATE UNIQUE INDEX "mock_drive_attempts_machineTestId_key" ON "mock_drive_attempts"("machineTestId");

-- CreateIndex
CREATE UNIQUE INDEX "mock_drive_attempts_aiInterviewSessionId_key" ON "mock_drive_attempts"("aiInterviewSessionId");

-- CreateIndex
CREATE INDEX "mock_drive_attempts_mockDriveId_status_idx" ON "mock_drive_attempts"("mockDriveId", "status");

-- CreateIndex
CREATE INDEX "mock_drive_attempts_userId_status_idx" ON "mock_drive_attempts"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "mock_drive_attempts_mockDriveId_userId_key" ON "mock_drive_attempts"("mockDriveId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "mock_drive_results_attemptId_key" ON "mock_drive_results"("attemptId");

-- CreateIndex
CREATE INDEX "mock_drive_results_mockDriveId_totalScore_idx" ON "mock_drive_results"("mockDriveId", "totalScore");

-- CreateIndex
CREATE INDEX "mock_drive_results_userId_idx" ON "mock_drive_results"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "mock_drive_rankings_resultId_key" ON "mock_drive_rankings"("resultId");

-- CreateIndex
CREATE INDEX "mock_drive_rankings_mockDriveId_rank_idx" ON "mock_drive_rankings"("mockDriveId", "rank");

-- CreateIndex
CREATE INDEX "mock_drive_rankings_userId_idx" ON "mock_drive_rankings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "mock_drive_rankings_mockDriveId_userId_key" ON "mock_drive_rankings"("mockDriveId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "mock_drive_rankings_mockDriveId_rank_key" ON "mock_drive_rankings"("mockDriveId", "rank");

-- AddForeignKey
ALTER TABLE "mock_drives" ADD CONSTRAINT "mock_drives_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_drives" ADD CONSTRAINT "mock_drives_aptitudeTestId_fkey" FOREIGN KEY ("aptitudeTestId") REFERENCES "aptitude_test_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_drive_machine_problems" ADD CONSTRAINT "mock_drive_machine_problems_mockDriveId_fkey" FOREIGN KEY ("mockDriveId") REFERENCES "mock_drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_drive_machine_problems" ADD CONSTRAINT "mock_drive_machine_problems_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "machine_test_problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_drive_registrations" ADD CONSTRAINT "mock_drive_registrations_mockDriveId_fkey" FOREIGN KEY ("mockDriveId") REFERENCES "mock_drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_drive_registrations" ADD CONSTRAINT "mock_drive_registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_drive_batches" ADD CONSTRAINT "mock_drive_batches_mockDriveId_fkey" FOREIGN KEY ("mockDriveId") REFERENCES "mock_drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_drive_batch_students" ADD CONSTRAINT "mock_drive_batch_students_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "mock_drive_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_drive_batch_students" ADD CONSTRAINT "mock_drive_batch_students_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "mock_drive_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_drive_attempts" ADD CONSTRAINT "mock_drive_attempts_mockDriveId_fkey" FOREIGN KEY ("mockDriveId") REFERENCES "mock_drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_drive_attempts" ADD CONSTRAINT "mock_drive_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_drive_attempts" ADD CONSTRAINT "mock_drive_attempts_aptitudeResponseId_fkey" FOREIGN KEY ("aptitudeResponseId") REFERENCES "aptitude_responses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_drive_attempts" ADD CONSTRAINT "mock_drive_attempts_machineTestId_fkey" FOREIGN KEY ("machineTestId") REFERENCES "machine_tests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_drive_attempts" ADD CONSTRAINT "mock_drive_attempts_aiInterviewSessionId_fkey" FOREIGN KEY ("aiInterviewSessionId") REFERENCES "ai_interview_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_drive_results" ADD CONSTRAINT "mock_drive_results_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "mock_drive_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_drive_results" ADD CONSTRAINT "mock_drive_results_mockDriveId_fkey" FOREIGN KEY ("mockDriveId") REFERENCES "mock_drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_drive_results" ADD CONSTRAINT "mock_drive_results_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_drive_rankings" ADD CONSTRAINT "mock_drive_rankings_mockDriveId_fkey" FOREIGN KEY ("mockDriveId") REFERENCES "mock_drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_drive_rankings" ADD CONSTRAINT "mock_drive_rankings_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "mock_drive_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_drive_rankings" ADD CONSTRAINT "mock_drive_rankings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "mock_drives" ADD COLUMN     "generatedAptitudeQuestions" JSONB;

-- CreateTable
CREATE TABLE "mock_drive_generated_problems" (
    "id" TEXT NOT NULL,
    "mockDriveId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" JSONB NOT NULL,
    "difficulty" "QuestionDifficulty" NOT NULL,
    "topic" TEXT NOT NULL,
    "hints" TEXT[],
    "testCases" JSONB NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 100,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "solvedCount" INTEGER NOT NULL DEFAULT 0,
    "partialSolveCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "testCaseMetrics" JSONB,
    "averageDifficulty" DECIMAL(3,2),
    "clarityScore" DECIMAL(3,2),
    "isMigrated" BOOLEAN NOT NULL DEFAULT false,
    "migratedToId" INTEGER,
    "migrationNotes" TEXT,
    "isTestCaseValidated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mock_drive_generated_problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_drive_problem_submissions" (
    "id" TEXT NOT NULL,
    "generatedProblemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "sourceCode" TEXT NOT NULL,
    "languageId" INTEGER NOT NULL,
    "testCaseResults" JSONB NOT NULL,
    "status" "SubmissionStatus" NOT NULL,
    "timeTakenSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mock_drive_problem_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_drive_aptitude_questions" (
    "id" TEXT NOT NULL,
    "mockDriveId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "difficulty" "QuestionDifficulty" NOT NULL,
    "topic" TEXT NOT NULL,
    "explanation" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "successRate" DECIMAL(5,2),
    "isMigrated" BOOLEAN NOT NULL DEFAULT false,
    "migratedToId" INTEGER,
    "migrationNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mock_drive_aptitude_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mock_drive_generated_problems_mockDriveId_idx" ON "mock_drive_generated_problems"("mockDriveId");

-- CreateIndex
CREATE INDEX "mock_drive_generated_problems_isMigrated_isTestCaseValidate_idx" ON "mock_drive_generated_problems"("isMigrated", "isTestCaseValidated");

-- CreateIndex
CREATE INDEX "mock_drive_problem_submissions_generatedProblemId_userId_idx" ON "mock_drive_problem_submissions"("generatedProblemId", "userId");

-- CreateIndex
CREATE INDEX "mock_drive_problem_submissions_attemptId_idx" ON "mock_drive_problem_submissions"("attemptId");

-- CreateIndex
CREATE INDEX "mock_drive_aptitude_questions_mockDriveId_idx" ON "mock_drive_aptitude_questions"("mockDriveId");

-- CreateIndex
CREATE INDEX "mock_drive_aptitude_questions_isMigrated_idx" ON "mock_drive_aptitude_questions"("isMigrated");

-- AddForeignKey
ALTER TABLE "mock_drive_generated_problems" ADD CONSTRAINT "mock_drive_generated_problems_mockDriveId_fkey" FOREIGN KEY ("mockDriveId") REFERENCES "mock_drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_drive_generated_problems" ADD CONSTRAINT "mock_drive_generated_problems_migratedToId_fkey" FOREIGN KEY ("migratedToId") REFERENCES "machine_test_problems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_drive_problem_submissions" ADD CONSTRAINT "mock_drive_problem_submissions_generatedProblemId_fkey" FOREIGN KEY ("generatedProblemId") REFERENCES "mock_drive_generated_problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_drive_problem_submissions" ADD CONSTRAINT "mock_drive_problem_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_drive_problem_submissions" ADD CONSTRAINT "mock_drive_problem_submissions_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "mock_drive_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_drive_aptitude_questions" ADD CONSTRAINT "mock_drive_aptitude_questions_mockDriveId_fkey" FOREIGN KEY ("mockDriveId") REFERENCES "mock_drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_drive_aptitude_questions" ADD CONSTRAINT "mock_drive_aptitude_questions_migratedToId_fkey" FOREIGN KEY ("migratedToId") REFERENCES "aptitude_questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

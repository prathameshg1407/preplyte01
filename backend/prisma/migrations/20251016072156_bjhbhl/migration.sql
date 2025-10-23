-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'INSTITUTION_ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED', 'PENDING_PROFILE_COMPLETION');

-- CreateEnum
CREATE TYPE "QuestionDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "MachineTestStatus" AS ENUM ('STARTED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'PASS', 'FAIL', 'PARTIAL', 'COMPILE_ERROR', 'RUNTIME_ERROR', 'TIMEOUT', 'QUEUED');

-- CreateEnum
CREATE TYPE "TagCategory" AS ENUM ('COMPANY', 'SKILL', 'LANGUAGE', 'TECHNOLOGY', 'FRAMEWORK', 'APTITUDE_TOPIC', 'CODING_TOPIC', 'OTHER');

-- CreateEnum
CREATE TYPE "ResumeAnalysisStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AiInterviewSessionStatus" AS ENUM ('STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AiInterviewQuestionCategory" AS ENUM ('INTRODUCTORY', 'TECHNICAL', 'PROJECT_BASED', 'BEHAVIORAL', 'SITUATIONAL', 'CLOSING');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'REVIEWED', 'SHORTLISTED', 'REJECTED', 'ACCEPTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hashedPassword" TEXT,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_PROFILE_COMPLETION',
    "institutionId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_accounts" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "graduationYear" INTEGER,
    "profileImageUrl" TEXT,
    "linkedinUrl" TEXT,
    "githubUrl" TEXT,
    "websiteUrl" TEXT,
    "sscPercentage" DECIMAL(5,2),
    "hscPercentage" DECIMAL(5,2),
    "diplomaPercentage" DECIMAL(5,2),
    "degreeSem1Cgpa" DECIMAL(5,2),
    "degreeSem2Cgpa" DECIMAL(5,2),
    "degreeSem3Cgpa" DECIMAL(5,2),
    "degreeSem4Cgpa" DECIMAL(5,2),
    "degreeSem5Cgpa" DECIMAL(5,2),
    "degreeSem6Cgpa" DECIMAL(5,2),
    "degreeSem7Cgpa" DECIMAL(5,2),
    "degreeSem8Cgpa" DECIMAL(5,2),
    "averageCgpa" DECIMAL(5,2),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "institutions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batches" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "institutionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resumes" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "filename" TEXT,
    "storagePath" TEXT NOT NULL,
    "content" TEXT,
    "analysisStatus" "ResumeAnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_analysis" (
    "id" SERIAL NOT NULL,
    "resumeId" INTEGER NOT NULL,
    "atsScore" DECIMAL(5,2) NOT NULL,
    "keywordsFound" TEXT[],
    "keywordsMissing" TEXT[],
    "formatScore" DECIMAL(5,2) NOT NULL,
    "suggestions" TEXT[],
    "analysisDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aptitude_test_definitions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "institutionId" INTEGER NOT NULL,

    CONSTRAINT "aptitude_test_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aptitude_questions" (
    "id" SERIAL NOT NULL,
    "sourceQuestionId" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "difficulty" "QuestionDifficulty" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aptitude_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aptitude_test_definition_questions" (
    "testDefinitionId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,

    CONSTRAINT "aptitude_test_definition_questions_pkey" PRIMARY KEY ("testDefinitionId","questionId")
);

-- CreateTable
CREATE TABLE "aptitude_responses" (
    "id" SERIAL NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aptitude_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machine_test_problems" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" JSONB NOT NULL,
    "difficulty" "QuestionDifficulty" NOT NULL,
    "testCases" JSONB NOT NULL,
    "institutionId" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machine_test_problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machine_tests" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "difficulty" "QuestionDifficulty" NOT NULL,
    "status" "MachineTestStatus" NOT NULL DEFAULT 'STARTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "machine_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machine_test_problem_links" (
    "id" SERIAL NOT NULL,
    "machineTestId" INTEGER NOT NULL,
    "problemId" INTEGER NOT NULL,

    CONSTRAINT "machine_test_problem_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machine_test_submissions" (
    "id" SERIAL NOT NULL,
    "userId" TEXT,
    "problemId" INTEGER NOT NULL,
    "machineTestId" INTEGER,
    "sourceCode" TEXT NOT NULL,
    "languageId" INTEGER NOT NULL,
    "stdin" TEXT,
    "judge0Response" JSONB NOT NULL,
    "status" "SubmissionStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machine_test_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programming_languages" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT,
    "isSupported" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "programming_languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" "TagCategory" NOT NULL,
    "parentId" INTEGER,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machine_test_problem_tags" (
    "problemId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "machine_test_problem_tags_pkey" PRIMARY KEY ("problemId","tagId")
);

-- CreateTable
CREATE TABLE "user_topic_performance" (
    "userId" TEXT NOT NULL,
    "tagId" INTEGER NOT NULL,
    "averageScore" DECIMAL(5,2) NOT NULL,
    "accuracy" DECIMAL(5,2) NOT NULL,
    "totalAttempts" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_topic_performance_pkey" PRIMARY KEY ("userId","tagId")
);

-- CreateTable
CREATE TABLE "job_postings" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "eligibilityCriteria" JSONB,
    "location" TEXT,
    "salary" TEXT,
    "applicationDeadline" TIMESTAMP(3),
    "institutionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_postings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" INTEGER NOT NULL,
    "resumeId" INTEGER,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internship_postings" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "eligibilityCriteria" JSONB,
    "location" TEXT,
    "stipend" TEXT,
    "duration" TEXT,
    "applicationDeadline" TIMESTAMP(3),
    "institutionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internship_postings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internship_applications" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "internshipId" INTEGER NOT NULL,
    "resumeId" INTEGER,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internship_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hackathon_postings" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "eligibilityCriteria" JSONB,
    "location" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "prizes" TEXT,
    "registrationDeadline" TIMESTAMP(3),
    "institutionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hackathon_postings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hackathon_registrations" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "hackathonId" INTEGER NOT NULL,
    "teamName" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hackathon_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_interview_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeId" INTEGER,
    "jobTitle" TEXT,
    "companyName" TEXT,
    "status" "AiInterviewSessionStatus" NOT NULL DEFAULT 'STARTED',
    "currentQuestionIndex" INTEGER NOT NULL DEFAULT 0,
    "totalQuestions" INTEGER NOT NULL DEFAULT 10,
    "questions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ai_interview_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_interview_responses" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "category" "AiInterviewQuestionCategory" NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "isFollowup" BOOLEAN NOT NULL DEFAULT false,
    "scoresJson" JSONB,
    "feedbackText" TEXT,
    "timeTakenSeconds" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_interview_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_interview_feedback" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "overallScore" DECIMAL(5,2) NOT NULL,
    "overallSummary" TEXT NOT NULL,
    "keyStrengths" TEXT[],
    "areasForImprovement" TEXT[],
    "feedbackJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_interview_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProfileSkills" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ProfileSkills_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AptitudeQuestionTags" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AptitudeQuestionTags_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_institutionId_role_status_idx" ON "users"("institutionId", "role", "status");

-- CreateIndex
CREATE INDEX "users_email_status_idx" ON "users"("email", "status");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_expiresAt_idx" ON "sessions"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "social_accounts_userId_idx" ON "social_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "social_accounts_provider_providerId_key" ON "social_accounts"("provider", "providerId");

-- CreateIndex
CREATE INDEX "profiles_graduationYear_averageCgpa_idx" ON "profiles"("graduationYear", "averageCgpa");

-- CreateIndex
CREATE UNIQUE INDEX "institutions_domain_key" ON "institutions"("domain");

-- CreateIndex
CREATE INDEX "institutions_domain_idx" ON "institutions"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "batches_institutionId_name_key" ON "batches"("institutionId", "name");

-- CreateIndex
CREATE INDEX "resumes_userId_isPrimary_analysisStatus_idx" ON "resumes"("userId", "isPrimary", "analysisStatus");

-- CreateIndex
CREATE UNIQUE INDEX "resumes_userId_title_key" ON "resumes"("userId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "resume_analysis_resumeId_key" ON "resume_analysis"("resumeId");

-- CreateIndex
CREATE UNIQUE INDEX "aptitude_test_definitions_name_institutionId_key" ON "aptitude_test_definitions"("name", "institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "aptitude_questions_sourceQuestionId_key" ON "aptitude_questions"("sourceQuestionId");

-- CreateIndex
CREATE INDEX "aptitude_questions_difficulty_idx" ON "aptitude_questions"("difficulty");

-- CreateIndex
CREATE INDEX "aptitude_responses_userId_type_percentage_idx" ON "aptitude_responses"("userId", "type", "percentage");

-- CreateIndex
CREATE INDEX "machine_test_problems_difficulty_isPublic_institutionId_idx" ON "machine_test_problems"("difficulty", "isPublic", "institutionId");

-- CreateIndex
CREATE INDEX "machine_tests_userId_status_difficulty_idx" ON "machine_tests"("userId", "status", "difficulty");

-- CreateIndex
CREATE UNIQUE INDEX "machine_test_problem_links_machineTestId_problemId_key" ON "machine_test_problem_links"("machineTestId", "problemId");

-- CreateIndex
CREATE INDEX "machine_test_submissions_userId_status_createdAt_idx" ON "machine_test_submissions"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "machine_test_submissions_problemId_status_idx" ON "machine_test_submissions"("problemId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "programming_languages_name_key" ON "programming_languages"("name");

-- CreateIndex
CREATE INDEX "programming_languages_isSupported_idx" ON "programming_languages"("isSupported");

-- CreateIndex
CREATE INDEX "tags_category_parentId_idx" ON "tags"("category", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_category_key" ON "tags"("name", "category");

-- CreateIndex
CREATE INDEX "user_topic_performance_averageScore_accuracy_idx" ON "user_topic_performance"("averageScore", "accuracy");

-- CreateIndex
CREATE INDEX "job_postings_institutionId_applicationDeadline_idx" ON "job_postings"("institutionId", "applicationDeadline");

-- CreateIndex
CREATE INDEX "job_applications_status_appliedAt_idx" ON "job_applications"("status", "appliedAt");

-- CreateIndex
CREATE UNIQUE INDEX "job_applications_userId_jobId_key" ON "job_applications"("userId", "jobId");

-- CreateIndex
CREATE INDEX "internship_postings_institutionId_applicationDeadline_idx" ON "internship_postings"("institutionId", "applicationDeadline");

-- CreateIndex
CREATE INDEX "internship_applications_status_appliedAt_idx" ON "internship_applications"("status", "appliedAt");

-- CreateIndex
CREATE UNIQUE INDEX "internship_applications_userId_internshipId_key" ON "internship_applications"("userId", "internshipId");

-- CreateIndex
CREATE INDEX "hackathon_postings_institutionId_registrationDeadline_idx" ON "hackathon_postings"("institutionId", "registrationDeadline");

-- CreateIndex
CREATE INDEX "hackathon_registrations_status_registeredAt_idx" ON "hackathon_registrations"("status", "registeredAt");

-- CreateIndex
CREATE UNIQUE INDEX "hackathon_registrations_userId_hackathonId_key" ON "hackathon_registrations"("userId", "hackathonId");

-- CreateIndex
CREATE INDEX "ai_interview_sessions_userId_status_idx" ON "ai_interview_sessions"("userId", "status");

-- CreateIndex
CREATE INDEX "ai_interview_responses_sessionId_timestamp_idx" ON "ai_interview_responses"("sessionId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "ai_interview_feedback_sessionId_key" ON "ai_interview_feedback"("sessionId");

-- CreateIndex
CREATE INDEX "ai_interview_feedback_userId_createdAt_idx" ON "ai_interview_feedback"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "_ProfileSkills_B_index" ON "_ProfileSkills"("B");

-- CreateIndex
CREATE INDEX "_AptitudeQuestionTags_B_index" ON "_AptitudeQuestionTags"("B");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_analysis" ADD CONSTRAINT "resume_analysis_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aptitude_test_definitions" ADD CONSTRAINT "aptitude_test_definitions_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aptitude_test_definition_questions" ADD CONSTRAINT "aptitude_test_definition_questions_testDefinitionId_fkey" FOREIGN KEY ("testDefinitionId") REFERENCES "aptitude_test_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aptitude_test_definition_questions" ADD CONSTRAINT "aptitude_test_definition_questions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "aptitude_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aptitude_responses" ADD CONSTRAINT "aptitude_responses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_test_problems" ADD CONSTRAINT "machine_test_problems_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_tests" ADD CONSTRAINT "machine_tests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_test_problem_links" ADD CONSTRAINT "machine_test_problem_links_machineTestId_fkey" FOREIGN KEY ("machineTestId") REFERENCES "machine_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_test_problem_links" ADD CONSTRAINT "machine_test_problem_links_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "machine_test_problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_test_submissions" ADD CONSTRAINT "machine_test_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_test_submissions" ADD CONSTRAINT "machine_test_submissions_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "machine_test_problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_test_submissions" ADD CONSTRAINT "machine_test_submissions_machineTestId_fkey" FOREIGN KEY ("machineTestId") REFERENCES "machine_tests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_test_submissions" ADD CONSTRAINT "machine_test_submissions_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "programming_languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "tags"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_test_problem_tags" ADD CONSTRAINT "machine_test_problem_tags_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "machine_test_problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_test_problem_tags" ADD CONSTRAINT "machine_test_problem_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_topic_performance" ADD CONSTRAINT "user_topic_performance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_topic_performance" ADD CONSTRAINT "user_topic_performance_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internship_postings" ADD CONSTRAINT "internship_postings_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internship_applications" ADD CONSTRAINT "internship_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internship_applications" ADD CONSTRAINT "internship_applications_internshipId_fkey" FOREIGN KEY ("internshipId") REFERENCES "internship_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hackathon_postings" ADD CONSTRAINT "hackathon_postings_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hackathon_registrations" ADD CONSTRAINT "hackathon_registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hackathon_registrations" ADD CONSTRAINT "hackathon_registrations_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "hackathon_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_interview_sessions" ADD CONSTRAINT "ai_interview_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_interview_sessions" ADD CONSTRAINT "ai_interview_sessions_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resumes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_interview_responses" ADD CONSTRAINT "ai_interview_responses_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ai_interview_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_interview_feedback" ADD CONSTRAINT "ai_interview_feedback_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ai_interview_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_interview_feedback" ADD CONSTRAINT "ai_interview_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProfileSkills" ADD CONSTRAINT "_ProfileSkills_A_fkey" FOREIGN KEY ("A") REFERENCES "profiles"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProfileSkills" ADD CONSTRAINT "_ProfileSkills_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AptitudeQuestionTags" ADD CONSTRAINT "_AptitudeQuestionTags_A_fkey" FOREIGN KEY ("A") REFERENCES "aptitude_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AptitudeQuestionTags" ADD CONSTRAINT "_AptitudeQuestionTags_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

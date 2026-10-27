-- The application form now stores the full applicant questionnaire,
-- which includes education and employment history.
ALTER TABLE "RecruitmentApplication" RENAME COLUMN "education" TO "questionnaire";

-- Finds unattached uploads efficiently for clean-up.
CREATE INDEX "ApplicationDocument_applicationId_createdAt_idx" ON "ApplicationDocument"("applicationId", "createdAt");

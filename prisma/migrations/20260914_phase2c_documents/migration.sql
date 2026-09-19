-- FACSS Phase 2C Non-Destructive Additive Migration
-- Documents Metadata & Security Attributes

ALTER TABLE "ServiceRequestDocument" ADD COLUMN IF NOT EXISTS "documentType" TEXT NOT NULL DEFAULT 'CLIENT_ATTACHMENT';
ALTER TABLE "ServiceRequestDocument" ADD COLUMN IF NOT EXISTS "originalFilename" TEXT;
ALTER TABLE "ServiceRequestDocument" ADD COLUMN IF NOT EXISTS "storageKey" TEXT;
ALTER TABLE "ServiceRequestDocument" ADD COLUMN IF NOT EXISTS "mimeType" TEXT;
ALTER TABLE "ServiceRequestDocument" ADD COLUMN IF NOT EXISTS "visibility" TEXT NOT NULL DEFAULT 'CLIENT_VISIBLE';
ALTER TABLE "ServiceRequestDocument" ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ServiceRequestDocument" ADD COLUMN IF NOT EXISTS "uploadedByUserId" TEXT;
ALTER TABLE "ServiceRequestDocument" ADD COLUMN IF NOT EXISTS "sizeBytes" INTEGER;
ALTER TABLE "ServiceRequestDocument" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Performance & Security Filter Indexes
CREATE INDEX IF NOT EXISTS "ServiceRequestDocument_documentType_idx" ON "ServiceRequestDocument"("documentType");
CREATE INDEX IF NOT EXISTS "ServiceRequestDocument_visibility_idx" ON "ServiceRequestDocument"("visibility");
CREATE INDEX IF NOT EXISTS "ServiceRequestDocument_isArchived_idx" ON "ServiceRequestDocument"("isArchived");
CREATE INDEX IF NOT EXISTS "ServiceRequestDocument_uploadedByUserId_idx" ON "ServiceRequestDocument"("uploadedByUserId");

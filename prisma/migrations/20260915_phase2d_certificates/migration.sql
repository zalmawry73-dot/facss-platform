-- Phase 2D: Certificate Revocation Support
-- Additive migration only — no destructive changes

ALTER TABLE "Certificate" ADD COLUMN IF NOT EXISTS "isRevoked" BOOLEAN DEFAULT false;
ALTER TABLE "Certificate" ADD COLUMN IF NOT EXISTS "revokedReason" TEXT;
ALTER TABLE "Certificate" ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP(3);

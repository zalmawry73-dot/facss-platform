-- FACSS Session Revocation Migration
-- Version: 20261013_session_revocation_token_version
-- Description: Non-destructive addition of tokenVersion column on User table for centralized global session revocation

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 1;

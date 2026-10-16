-- FACSS Session Revocation Rollback Script (Down Migration)
-- Target: In case of rollback, safely drop the tokenVersion column

ALTER TABLE "User" DROP COLUMN IF EXISTS "tokenVersion";

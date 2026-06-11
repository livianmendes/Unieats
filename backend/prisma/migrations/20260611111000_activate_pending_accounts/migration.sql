UPDATE "users"
SET
  "status" = 'active',
  "verificationCode" = NULL,
  "verificationExpiresAt" = NULL
WHERE "status" = 'pending'
  AND "deletedAt" IS NULL;

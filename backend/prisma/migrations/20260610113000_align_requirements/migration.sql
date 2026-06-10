ALTER TABLE "users" ADD COLUMN "storeOpen" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "verificationCode" TEXT;
ALTER TABLE "users" ADD COLUMN "verificationExpiresAt" DATETIME;
ALTER TABLE "users" ADD COLUMN "termsAcceptedAt" DATETIME;

ALTER TABLE "products" ADD COLUMN "imageUrl" TEXT;

ALTER TABLE "orders" ADD COLUMN "rating" INTEGER;
ALTER TABLE "orders" ADD COLUMN "reviewComment" TEXT;

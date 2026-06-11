PRAGMA foreign_keys=OFF;

ALTER TABLE "users" ADD COLUMN "deletedAt" DATETIME;

CREATE TABLE "buyer_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "buyer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "buyer_profiles_userId_key" ON "buyer_profiles"("userId");

CREATE TABLE "seller_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "curso" TEXT NOT NULL,
    "universidade" TEXT NOT NULL,
    "storeOpen" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "seller_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "seller_profiles_userId_key" ON "seller_profiles"("userId");

INSERT INTO "buyer_profiles" ("id", "userId", "name", "phone", "createdAt", "updatedAt")
SELECT 'buyer_' || "id", "id", "name", "phone", "createdAt", "updatedAt"
FROM "users"
WHERE "role" = 'comprador';

INSERT INTO "seller_profiles" ("id", "userId", "name", "phone", "matricula", "curso", "universidade", "storeOpen", "createdAt", "updatedAt")
SELECT 'seller_' || "id", "id", "name", "phone", COALESCE("matricula", ''), COALESCE("curso", ''), COALESCE("universidade", ''), COALESCE("storeOpen", true), "createdAt", "updatedAt"
FROM "users"
WHERE "role" = 'vendedor';

CREATE TABLE "new_products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "category" TEXT NOT NULL,
    "stock" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "sellerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "products_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "seller_profiles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_products" ("id", "title", "description", "price", "category", "stock", "imageUrl", "sellerId", "createdAt", "updatedAt")
SELECT p."id", p."title", p."description", p."price", p."category", p."stock", p."imageUrl", sp."id", p."createdAt", p."updatedAt"
FROM "products" p
INNER JOIN "seller_profiles" sp ON sp."userId" = p."sellerId";

CREATE TABLE "new_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "total" REAL NOT NULL,
    "deliveryPoint" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Aguardando confirmação',
    "rating" INTEGER,
    "reviewComment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "orders_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "buyer_profiles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "orders_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "seller_profiles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_orders" ("id", "buyerId", "sellerId", "total", "deliveryPoint", "paymentMethod", "status", "rating", "reviewComment", "createdAt", "updatedAt")
SELECT o."id", bp."id", sp."id", o."total", o."deliveryPoint", o."paymentMethod", o."status", o."rating", o."reviewComment", o."createdAt", o."updatedAt"
FROM "orders" o
INNER JOIN "buyer_profiles" bp ON bp."userId" = o."buyerId"
INNER JOIN "seller_profiles" sp ON sp."userId" = o."sellerId";

CREATE TABLE "new_order_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_order_items" ("id", "orderId", "productId", "quantity", "price")
SELECT oi."id", oi."orderId", oi."productId", oi."quantity", oi."price"
FROM "order_items" oi
INNER JOIN "new_orders" no ON no."id" = oi."orderId"
INNER JOIN "new_products" np ON np."id" = oi."productId";

CREATE TABLE "new_cart_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    CONSTRAINT "cart_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cart_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_cart_items" ("id", "userId", "productId", "quantity")
SELECT ci."id", ci."userId", ci."productId", ci."quantity"
FROM "cart_items" ci
INNER JOIN "new_products" np ON np."id" = ci."productId";

DROP TABLE "cart_items";
DROP TABLE "order_items";
DROP TABLE "orders";
DROP TABLE "products";

ALTER TABLE "new_products" RENAME TO "products";
ALTER TABLE "new_orders" RENAME TO "orders";
ALTER TABLE "new_order_items" RENAME TO "order_items";
ALTER TABLE "new_cart_items" RENAME TO "cart_items";

CREATE UNIQUE INDEX "cart_items_userId_productId_key" ON "cart_items"("userId", "productId");

PRAGMA foreign_keys=ON;

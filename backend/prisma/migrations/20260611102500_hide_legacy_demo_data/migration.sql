UPDATE "buyer_profiles"
SET "deletedAt" = CURRENT_TIMESTAMP
WHERE "userId" IN (
  SELECT "id" FROM "users"
  WHERE "email" = 'cliente@unieats.demo'
);

UPDATE "users"
SET "status" = 'deleted', "deletedAt" = CURRENT_TIMESTAMP
WHERE "email" = 'cliente@unieats.demo';

UPDATE "seller_profiles"
SET "deletedAt" = CURRENT_TIMESTAMP, "storeOpen" = false
WHERE "userId" IN (
  SELECT "id" FROM "users"
  WHERE "email" = 'livian@academico.ufgd'
    AND "name" = 'Livian'
    AND "phone" = '67999991111'
    AND "matricula" = '20260001'
);

UPDATE "users"
SET "status" = 'deleted', "deletedAt" = CURRENT_TIMESTAMP
WHERE "email" = 'livian@academico.ufgd'
  AND "name" = 'Livian'
  AND "phone" = '67999991111'
  AND "matricula" = '20260001';

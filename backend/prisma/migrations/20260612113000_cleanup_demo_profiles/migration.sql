UPDATE "users"
SET
  "email" = 'marina.alves@unieats.app',
  "name" = 'Marina Alves',
  "phone" = '67999990001',
  "status" = 'active',
  "deletedAt" = NULL,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "email" = 'comprador.teste@unieats.app';

UPDATE "buyer_profiles"
SET
  "name" = 'Marina Alves',
  "phone" = '67999990001',
  "deletedAt" = NULL,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "userId" IN (
  SELECT "id" FROM "users" WHERE "email" = 'marina.alves@unieats.app'
);

UPDATE "users"
SET
  "email" = 'ana.souza@unieats.app',
  "name" = 'Ana Clara Souza',
  "phone" = '67999990002',
  "matricula" = '20260002',
  "curso" = 'Gastronomia',
  "universidade" = 'UFGD',
  "status" = 'active',
  "deletedAt" = NULL,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "email" = 'vendedor.teste@unieats.app';

UPDATE "seller_profiles"
SET
  "name" = 'Ana Clara Souza',
  "phone" = '67999990002',
  "matricula" = '20260002',
  "curso" = 'Gastronomia',
  "universidade" = 'UFGD',
  "storeOpen" = 1,
  "deletedAt" = NULL,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "userId" IN (
  SELECT "id" FROM "users" WHERE "email" = 'ana.souza@unieats.app'
);

UPDATE "products"
SET
  "title" = 'Bolo de Pote da Ana',
  "description" = 'Bolo de pote cremoso com massa de chocolate e recheio de ninho.',
  "category" = 'Doces',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "sellerId" IN (
  SELECT "id" FROM "seller_profiles"
  WHERE "userId" IN (SELECT "id" FROM "users" WHERE "email" = 'ana.souza@unieats.app')
)
AND "title" IN ('Bolo de Pote Demo', 'Bolo de Pote Teste');

UPDATE "products"
SET
  "title" = 'Brigadeiro Gourmet da Ana',
  "description" = 'Brigadeiros gourmet feitos com chocolate meio amargo.',
  "category" = 'Doces',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "sellerId" IN (
  SELECT "id" FROM "seller_profiles"
  WHERE "userId" IN (SELECT "id" FROM "users" WHERE "email" = 'ana.souza@unieats.app')
)
AND "title" IN ('Brigadeiro Gourmet Demo', 'Brigadeiro Gourmet Teste');

UPDATE "products"
SET
  "title" = 'Coxinha Crocante da Ana',
  "description" = 'Coxinha de frango com massa leve e casquinha crocante.',
  "category" = 'Salgados',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "sellerId" IN (
  SELECT "id" FROM "seller_profiles"
  WHERE "userId" IN (SELECT "id" FROM "users" WHERE "email" = 'ana.souza@unieats.app')
)
AND "title" IN ('Coxinha Demo', 'Coxinha Teste');

UPDATE "products"
SET
  "title" = REPLACE(REPLACE("title", ' Demo', ''), ' Teste', ''),
  "description" = REPLACE(REPLACE("description", ' demo', ''), ' teste', ''),
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "title" LIKE '% Demo%' OR "title" LIKE '% Teste%';

UPDATE "users"
SET
  "status" = 'deleted',
  "deletedAt" = CURRENT_TIMESTAMP,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE (
  lower("email") LIKE 'vendedor.teste.%'
  OR lower("email") LIKE 'testevendedor-%'
  OR lower("name") IN ('vendedor teste', 'comprador teste')
);

UPDATE "seller_profiles"
SET
  "storeOpen" = 0,
  "deletedAt" = CURRENT_TIMESTAMP,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "userId" IN (
  SELECT "id" FROM "users"
  WHERE "status" = 'deleted'
  AND (
    lower("email") LIKE 'vendedor.teste.%'
    OR lower("email") LIKE 'testevendedor-%'
    OR lower("name") = 'vendedor teste'
  )
);

UPDATE "buyer_profiles"
SET
  "deletedAt" = CURRENT_TIMESTAMP,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "userId" IN (
  SELECT "id" FROM "users"
  WHERE "status" = 'deleted'
  AND lower("name") = 'comprador teste'
);

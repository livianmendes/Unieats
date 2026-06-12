UPDATE "users"
SET "status" = 'active',
    "deletedAt" = NULL
WHERE "email" IN (
  'livian@academico.ufgd',
  'livian.mendes077@academico.ufgd'
);

UPDATE "seller_profiles"
SET "deletedAt" = NULL,
    "storeOpen" = true
WHERE "userId" IN (
  SELECT "id" FROM "users"
  WHERE "email" IN (
    'livian@academico.ufgd',
    'livian.mendes077@academico.ufgd'
  )
);

UPDATE "products"
SET "stock" = CASE "title"
  WHEN 'Brigadeiro Gourmet' THEN 21
  WHEN 'Fatia de Bolo' THEN 6
  WHEN 'Bolo de Pote' THEN 13
  WHEN 'Coxinha Crocante' THEN 19
  WHEN 'Donuts Recheado' THEN 10
  WHEN 'Sanduíche Natural' THEN 11
  WHEN 'Café Gelado' THEN 15
  WHEN 'Brownie de Chocolate' THEN 17
  WHEN 'Pão de mel' THEN 10
  WHEN 'Pão de Mel' THEN 10
  WHEN 'Donut Recheado' THEN 10
  ELSE "stock"
END
WHERE "title" IN (
  'Brigadeiro Gourmet',
  'Fatia de Bolo',
  'Bolo de Pote',
  'Coxinha Crocante',
  'Donuts Recheado',
  'Sanduíche Natural',
  'Café Gelado',
  'Brownie de Chocolate',
  'Pão de mel',
  'Pão de Mel',
  'Donut Recheado'
);

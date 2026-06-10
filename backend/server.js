const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3100;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

const DEMO_BUYER_EMAIL = 'cliente@unieats.demo';
const DEMO_SELLER_EMAIL = 'livian@academico.ufgd';

const demoProducts = [
  {
    title: 'Brigadeiro Gourmet',
    description: 'Brigadeiros sortidos com granulado belga.',
    price: 3.5,
    category: 'Doces',
    stock: 24,
  },
  {
    title: 'Fatia de Bolo',
    description: 'Bolo molhadinho com recheio cremoso.',
    price: 20,
    category: 'Doces',
    stock: 8,
  },
  {
    title: 'Bolo de Pote',
    description: 'Camadas de chocolate, creme e morango.',
    price: 7.99,
    category: 'Doces',
    stock: 14,
  },
  {
    title: 'Coxinha Crocante',
    description: 'Massa leve com frango bem temperado.',
    price: 6,
    category: 'Salgados',
    stock: 20,
  },
  {
    title: 'Donuts Recheado',
    description: 'Donuts com brigadeiro e cobertura especial.',
    price: 8.5,
    category: 'Doces',
    stock: 10,
  },
  {
    title: 'Sanduíche Natural',
    description: 'Frango, cenoura, alface e molho da casa.',
    price: 12,
    category: 'Lanches',
    stock: 12,
  },
  {
    title: 'Café Gelado',
    description: 'Café cremoso com leite e calda de chocolate.',
    price: 9,
    category: 'Bebidas',
    stock: 16,
  },
  {
    title: 'Brownie de Chocolate',
    description: 'Brownie intenso com casquinha crocante.',
    price: 7.5,
    category: 'Doces',
    stock: 18,
  },
];

app.use(cors());
app.use(express.json());

function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function parsePositiveInteger(value, fallback = 1) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function isValidRole(role) {
  return role === 'comprador' || role === 'vendedor';
}

async function seedDemoData() {
  const password = await bcrypt.hash('123456', 10);
  const buyer = await prisma.user.upsert({
    where: { email: DEMO_BUYER_EMAIL },
    update: {
      name: 'Cliente UniEats',
      role: 'comprador',
      phone: '67999990000',
      status: 'active',
      password,
    },
    create: {
      email: DEMO_BUYER_EMAIL,
      role: 'comprador',
      name: 'Cliente UniEats',
      phone: '67999990000',
      status: 'active',
      password,
    },
  });
  const seller = await prisma.user.upsert({
    where: { email: DEMO_SELLER_EMAIL },
    update: {
      name: 'Livian',
      role: 'vendedor',
      phone: '67999991111',
      matricula: '20260001',
      curso: 'Administração',
      universidade: 'UFGD',
      status: 'active',
      password,
    },
    create: {
      email: DEMO_SELLER_EMAIL,
      role: 'vendedor',
      name: 'Livian',
      phone: '67999991111',
      matricula: '20260001',
      curso: 'Administração',
      universidade: 'UFGD',
      status: 'active',
      password,
    },
  });

  const sellerProducts = await prisma.product.count({
    where: { sellerId: seller.id },
  });

  if (sellerProducts === 0) {
    await prisma.product.createMany({
      data: demoProducts.map((product) => ({
        ...product,
        sellerId: seller.id,
      })),
    });
  }

  return { buyer, seller };
}

async function getDemoUser(role) {
  const email = role === 'vendedor' ? DEMO_SELLER_EMAIL : DEMO_BUYER_EMAIL;
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    return user;
  }

  const seeded = await seedDemoData();
  return role === 'vendedor' ? seeded.seller : seeded.buyer;
}

async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não informado.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido ou expirado.' });
  }
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

app.get('/api/demo-user', async (req, res) => {
  const role = req.query.role === 'vendedor' ? 'vendedor' : 'comprador';
  const user = await getDemoUser(role);
  res.json({ user: sanitizeUser(user) });
});

app.post('/api/auth/register', async (req, res) => {
  const {
    email,
    password,
    role,
    name,
    phone,
    matricula,
    curso,
    universidade,
  } = req.body;

  if (!email || !password || !role || !name || !phone) {
    return res.status(400).json({ error: 'Preencha nome, e-mail, telefone, senha e perfil.' });
  }

  if (!isValidRole(role)) {
    return res.status(400).json({ error: 'Perfil inválido.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
  }

  if (role === 'vendedor' && (!matricula || !curso || !universidade)) {
    return res.status(400).json({ error: 'Vendedores precisam informar matrícula, curso e universidade.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        role,
        name: name.trim(),
        phone: phone.trim(),
        matricula: matricula?.trim() || null,
        curso: curso?.trim() || null,
        universidade: universidade?.trim() || null,
        status: 'active',
        password: hashedPassword,
      },
    });

    const token = signToken(user);
    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
    }

    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Informe e-mail, senha e perfil.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user || user.role !== role) {
      return res.status(401).json({ error: 'E-mail, senha ou perfil inválido.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'E-mail, senha ou perfil inválido.' });
    }

    const token = signToken(user);
    res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { seller: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(products);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/products', authenticateToken, async (req, res) => {
  if (req.user.role !== 'vendedor') {
    return res.status(403).json({ error: 'Apenas vendedores podem cadastrar produtos.' });
  }

  const { title, description, price, category, stock } = req.body;
  const parsedPrice = Number.parseFloat(price);
  const parsedStock = Number.parseInt(stock, 10);

  if (!title || !description || !category || !parsedPrice || parsedPrice <= 0 || !parsedStock || parsedStock <= 0) {
    return res.status(400).json({ error: 'Informe título, descrição, categoria, preço e estoque válidos.' });
  }

  try {
    const product = await prisma.product.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        price: parsedPrice,
        category: category.trim(),
        stock: parsedStock,
        sellerId: req.user.id,
      },
      include: { seller: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/cart', authenticateToken, async (req, res) => {
  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: { product: { include: { seller: { select: { id: true, name: true, email: true } } } } },
      orderBy: { id: 'asc' },
    });
    res.json(cartItems);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/cart', authenticateToken, async (req, res) => {
  if (req.user.role !== 'comprador') {
    return res.status(403).json({ error: 'Entre como comprador para adicionar itens ao carrinho.' });
  }

  const { productId, quantity } = req.body;
  const parsedQuantity = parsePositiveInteger(quantity);

  if (!productId) {
    return res.status(400).json({ error: 'Produto não informado.' });
  }

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    if (parsedQuantity > product.stock) {
      return res.status(400).json({ error: 'Quantidade maior que o estoque disponível.' });
    }

    const cartItem = await prisma.cartItem.upsert({
      where: { userId_productId: { userId: req.user.id, productId } },
      update: { quantity: parsedQuantity },
      create: { userId: req.user.id, productId, quantity: parsedQuantity },
      include: { product: { include: { seller: { select: { id: true, name: true, email: true } } } } },
    });

    res.json(cartItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/cart/:productId', authenticateToken, async (req, res) => {
  const { productId } = req.params;

  try {
    await prisma.cartItem.delete({
      where: { userId_productId: { userId: req.user.id, productId } },
    });
    res.json({ message: 'Produto removido do carrinho.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/orders', authenticateToken, async (req, res) => {
  if (req.user.role !== 'comprador') {
    return res.status(403).json({ error: 'Entre como comprador para fechar pedidos.' });
  }

  const { deliveryPoint, paymentMethod } = req.body;

  if (!deliveryPoint || !paymentMethod) {
    return res.status(400).json({ error: 'Informe ponto de entrega e forma de pagamento.' });
  }

  try {
    const createdOrder = await prisma.$transaction(async (tx) => {
      const cartItems = await tx.cartItem.findMany({
        where: { userId: req.user.id },
        include: { product: true },
      });

      if (cartItems.length === 0) {
        throw new Error('Carrinho vazio.');
      }

      const sellerIds = new Set(cartItems.map((item) => item.product.sellerId));
      if (sellerIds.size > 1) {
        throw new Error('Finalize pedidos de vendedores diferentes separadamente.');
      }

      for (const item of cartItems) {
        if (item.quantity > item.product.stock) {
          throw new Error(`Estoque insuficiente para ${item.product.title}.`);
        }
      }

      const total = cartItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      );

      const order = await tx.order.create({
        data: {
          buyerId: req.user.id,
          sellerId: cartItems[0].product.sellerId,
          total,
          deliveryPoint: deliveryPoint.trim(),
          paymentMethod: paymentMethod.trim(),
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
      });

      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await tx.cartItem.deleteMany({ where: { userId: req.user.id } });

      return tx.order.findUnique({
        where: { id: order.id },
        include: { items: { include: { product: true } } },
      });
    });

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const isSeller = req.query.seller === 'true';
    const where = isSeller ? { sellerId: req.user.id } : { buyerId: req.user.id };
    const orders = await prisma.order.findMany({
      where,
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.patch('/api/orders/:id/status', authenticateToken, async (req, res) => {
  if (req.user.role !== 'vendedor') {
    return res.status(403).json({ error: 'Entre como vendedor para atualizar pedidos.' });
  }

  const { id } = req.params;
  const { status } = req.body;
  const allowedStatuses = [
    'Aguardando confirmação',
    'Em preparo',
    'Saiu para entrega',
    'Finalizado',
  ];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Status inválido.' });
  }

  try {
    const existingOrder = await prisma.order.findUnique({ where: { id } });

    if (!existingOrder) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    if (existingOrder.sellerId !== req.user.id) {
      return res.status(403).json({ error: 'Apenas o vendedor deste pedido pode atualizar o status.' });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: { items: { include: { product: true } } },
    });
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

seedDemoData()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });

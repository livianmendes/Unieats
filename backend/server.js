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

app.use(cors());
app.use(express.json({ limit: '8mb' }));

function sanitizeUser(user) {
  if (!user) return null;
  const { password, verificationCode, verificationExpiresAt, buyerProfile, sellerProfile, ...safeUser } = user;
  const profile = user.role === 'vendedor' ? sellerProfile : buyerProfile;

  return {
    ...safeUser,
    profileId: profile?.id ?? null,
    buyerProfileId: buyerProfile?.id ?? null,
    sellerProfileId: sellerProfile?.id ?? null,
    name: profile?.name ?? safeUser.name,
    phone: profile?.phone ?? safeUser.phone,
    avatarUrl: profile?.avatarUrl ?? null,
    matricula: sellerProfile?.matricula ?? safeUser.matricula,
    curso: sellerProfile?.curso ?? safeUser.curso,
    universidade: sellerProfile?.universidade ?? safeUser.universidade,
    storeOpen: sellerProfile?.storeOpen ?? true,
  };
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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(String(email ?? '').trim());
}

function normalizeOptionalUrl(value) {
  const trimmed = String(value ?? '').trim();

  if (!trimmed) {
    return null;
  }

  if (/^data:image\/(png|jpe?g|webp);base64,[a-z0-9+/=]+$/i.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:' ? trimmed : undefined;
  } catch {
    return undefined;
  }
}

const userInclude = {
  buyerProfile: true,
  sellerProfile: true,
};

const DEMO_PASSWORD = 'Teste123';
const demoAccounts = {
  comprador: {
    email: 'marina.alves@unieats.app',
    name: 'Marina Alves',
    phone: '67999990001',
  },
  vendedor: {
    email: 'ana.souza@unieats.app',
    name: 'Ana Clara Souza',
    phone: '67999990002',
    matricula: '20260002',
    curso: 'Gastronomia',
    universidade: 'UFGD',
    products: [
      {
        title: 'Bolo de Pote da Ana',
        description: 'Bolo de pote cremoso com massa de chocolate e recheio de ninho.',
        price: 12,
        category: 'Doces',
        stock: 20,
      },
      {
        title: 'Brigadeiro Gourmet da Ana',
        description: 'Brigadeiros gourmet feitos com chocolate meio amargo.',
        price: 5,
        category: 'Doces',
        stock: 30,
      },
      {
        title: 'Coxinha Crocante da Ana',
        description: 'Coxinha de frango com massa leve e casquinha crocante.',
        price: 8,
        category: 'Salgados',
        stock: 18,
      },
    ],
  },
};

const legacyDemoProductTitles = {
  'Bolo de Pote Teste': 'Bolo de Pote da Ana',
  'Bolo de Pote Demo': 'Bolo de Pote da Ana',
  'Brigadeiro Gourmet Teste': 'Brigadeiro Gourmet da Ana',
  'Brigadeiro Gourmet Demo': 'Brigadeiro Gourmet da Ana',
  'Coxinha Teste': 'Coxinha Crocante da Ana',
  'Coxinha Demo': 'Coxinha Crocante da Ana',
};

const sellerProfileSelect = {
  id: true,
  userId: true,
  name: true,
  phone: true,
  matricula: true,
  curso: true,
  universidade: true,
  storeOpen: true,
  avatarUrl: true,
  deletedAt: true,
  user: { select: { id: true, email: true, deletedAt: true, status: true } },
};

const productInclude = {
  seller: { select: sellerProfileSelect },
};

const orderInclude = {
  items: { include: { product: { include: productInclude } } },
};

async function findUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    include: userInclude,
  });
}

function serializeSellerProfile(profile) {
  if (!profile) return null;

  return {
    id: profile.id,
    userId: profile.userId,
    name: profile.name,
    email: profile.user?.email,
    phone: profile.phone,
    matricula: profile.matricula,
    curso: profile.curso,
    universidade: profile.universidade,
    storeOpen: profile.storeOpen,
    avatarUrl: profile.avatarUrl,
  };
}

function serializeProduct(product) {
  if (!product) return null;
  const { seller, ...productData } = product;

  return {
    ...productData,
    seller: serializeSellerProfile(seller),
  };
}

function serializeCartItem(cartItem) {
  if (!cartItem) return null;

  return {
    ...cartItem,
    product: serializeProduct(cartItem.product),
  };
}

function serializeOrder(order) {
  if (!order) return null;

  return {
    ...order,
    items: order.items?.map((item) => ({
      ...item,
      product: serializeProduct(item.product),
    })) ?? [],
  };
}

async function ensureDemoProduct(sellerId, product) {
  const existingProduct = await prisma.product.findFirst({
    where: {
      sellerId,
      title: product.title,
    },
  });

  if (existingProduct) {
    return prisma.product.update({
      where: { id: existingProduct.id },
      data: product,
    });
  }

  return prisma.product.create({
    data: {
      ...product,
      sellerId,
    },
  });
}

async function ensureDemoUser(role) {
  const demo = demoAccounts[role];
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
  const baseUserData = {
    email: demo.email,
    role,
    name: demo.name,
    phone: demo.phone,
    matricula: demo.matricula ?? null,
    curso: demo.curso ?? null,
    universidade: demo.universidade ?? null,
    status: 'active',
    verificationCode: null,
    verificationExpiresAt: null,
    termsAcceptedAt: new Date(),
    deletedAt: null,
    password: hashedPassword,
  };
  const existingUser = await prisma.user.findUnique({
    where: { email: demo.email },
  });

  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: baseUserData,
      })
    : await prisma.user.create({
        data: {
          ...baseUserData,
          buyerProfile: role === 'comprador'
            ? {
                create: {
                  name: demo.name,
                  phone: demo.phone,
                },
              }
            : undefined,
          sellerProfile: role === 'vendedor'
            ? {
                create: {
                  name: demo.name,
                  phone: demo.phone,
                  matricula: demo.matricula,
                  curso: demo.curso,
                  universidade: demo.universidade,
                  storeOpen: true,
                },
              }
            : undefined,
        },
      });

  if (role === 'comprador') {
    await prisma.buyerProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        name: demo.name,
        phone: demo.phone,
      },
      update: {
        name: demo.name,
        phone: demo.phone,
        deletedAt: null,
      },
    });
  }

  if (role === 'vendedor') {
    const sellerProfile = await prisma.sellerProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        name: demo.name,
        phone: demo.phone,
        matricula: demo.matricula,
        curso: demo.curso,
        universidade: demo.universidade,
        storeOpen: true,
      },
      update: {
        name: demo.name,
        phone: demo.phone,
        matricula: demo.matricula,
        curso: demo.curso,
        universidade: demo.universidade,
        storeOpen: true,
        deletedAt: null,
      },
    });

    for (const [oldTitle, newTitle] of Object.entries(legacyDemoProductTitles)) {
      await prisma.product.updateMany({
        where: {
          sellerId: sellerProfile.id,
          title: oldTitle,
        },
        data: {
          title: newTitle,
        },
      });
    }

    for (const product of demo.products) {
      await ensureDemoProduct(sellerProfile.id, product);
    }
  }

  return findUserById(user.id);
}

async function getOptionalUser(req) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await findUserById(payload.id);
    return user?.deletedAt ? null : user;
  } catch {
    return null;
  }
}

function buildChatReply(text, products) {
  const message = text.toLowerCase();
  const productNames = products.slice(0, 2).map((product) => product.title);
  const availableText = productNames.length
    ? `Hoje temos ${productNames.join(' e ')} disponíveis.`
    : 'Temos produtos disponíveis na vitrine.';

  if (message.includes('reserv') || message.includes('pedido')) {
    return `${availableText} Para reservar, adicione o produto ao carrinho e finalize o pedido.`;
  }

  if (message.includes('preco') || message.includes('preço') || message.includes('valor') || message.includes('quanto')) {
    return 'Os valores aparecem na vitrine de produtos, e você consegue montar o carrinho antes de finalizar.';
  }

  if (message.includes('dispon') || message.includes('tem')) {
    return availableText;
  }

  return 'Recebi sua mensagem! Posso te ajudar com disponibilidade, valores ou reserva dos produtos.';
}

async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não informado.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await findUserById(payload.id);

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado.' });
    }

    if (user.deletedAt || user.status === 'deleted') {
      return res.status(401).json({ error: 'Conta excluída.' });
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

app.patch('/api/auth/me', authenticateToken, async (req, res) => {
  const { name, phone, matricula, curso, universidade, avatarUrl } = req.body;

  if (!name?.trim() || !phone?.trim()) {
    return res.status(400).json({ error: 'Informe nome e telefone.' });
  }

  if (req.user.role === 'vendedor' && (!matricula?.trim() || !curso?.trim() || !universidade?.trim())) {
    return res.status(400).json({ error: 'Vendedores precisam informar matrícula, curso e universidade.' });
  }

  const nextAvatarUrl = avatarUrl === undefined ? undefined : normalizeOptionalUrl(avatarUrl);

  if (avatarUrl !== undefined && nextAvatarUrl === undefined) {
    return res.status(400).json({ error: 'Informe uma URL ou arquivo de imagem válido.' });
  }

  try {
    const userData = {
      name: name.trim(),
      phone: phone.trim(),
    };

    if (req.user.role === 'vendedor') {
      userData.matricula = matricula.trim();
      userData.curso = curso.trim();
      userData.universidade = universidade.trim();
    }

    const profileImageData = avatarUrl === undefined ? {} : { avatarUrl: nextAvatarUrl };

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: req.user.id },
        data: userData,
      });

      if (req.user.role === 'vendedor') {
        await tx.sellerProfile.update({
          where: { userId: req.user.id },
          data: {
            name: name.trim(),
            phone: phone.trim(),
            matricula: matricula.trim(),
            curso: curso.trim(),
            universidade: universidade.trim(),
            ...profileImageData,
          },
        });
        return;
      }

      await tx.buyerProfile.update({
        where: { userId: req.user.id },
        data: {
          name: name.trim(),
          phone: phone.trim(),
          ...profileImageData,
        },
      });
    });

    const user = await findUserById(req.user.id);

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const deletedAt = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: req.user.id },
        data: { status: 'deleted', deletedAt },
      });

      await tx.cartItem.deleteMany({ where: { userId: req.user.id } });

      if (req.user.role === 'vendedor') {
        await tx.sellerProfile.update({
          where: { userId: req.user.id },
          data: { deletedAt, storeOpen: false },
        });

        const sellerId = req.user.sellerProfile?.id;
        if (sellerId) {
          await tx.cartItem.deleteMany({
            where: { product: { is: { sellerId } } },
          });
        }
        return;
      }

      await tx.buyerProfile.update({
        where: { userId: req.user.id },
        data: { deletedAt },
      });
    });

    res.json({ message: 'Conta excluída com sucesso.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.patch('/api/store/status', authenticateToken, async (req, res) => {
  if (req.user.role !== 'vendedor') {
    return res.status(403).json({ error: 'Apenas vendedores podem alterar o status da loja.' });
  }

  const storeOpen = Boolean(req.body.storeOpen);

  try {
    await prisma.sellerProfile.update({
      where: { userId: req.user.id },
      data: { storeOpen },
    });
    const user = await findUserById(req.user.id);

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const {
    email,
    password,
    role,
    name,
    phone,
    avatarUrl,
    matricula,
    curso,
    universidade,
    termsAccepted,
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

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Informe um e-mail válido.' });
  }

  if (!termsAccepted) {
    return res.status(400).json({ error: 'Aceite os Termos de Uso e a Política de Privacidade.' });
  }

  const nextAvatarUrl = avatarUrl === undefined ? undefined : normalizeOptionalUrl(avatarUrl);

  if (avatarUrl !== undefined && nextAvatarUrl === undefined) {
    return res.status(400).json({ error: 'Informe uma URL ou arquivo de imagem válido.' });
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
        verificationCode: null,
        verificationExpiresAt: null,
        termsAcceptedAt: new Date(),
        password: hashedPassword,
        buyerProfile: role === 'comprador'
          ? {
              create: {
                name: name.trim(),
                phone: phone.trim(),
                avatarUrl: nextAvatarUrl,
              },
            }
          : undefined,
        sellerProfile: role === 'vendedor'
          ? {
              create: {
                name: name.trim(),
                phone: phone.trim(),
                matricula: matricula.trim(),
                curso: curso.trim(),
                universidade: universidade.trim(),
                storeOpen: true,
                avatarUrl: nextAvatarUrl,
              },
            }
          : undefined,
      },
      include: userInclude,
    });

    res.status(201).json({
      user: sanitizeUser(user),
      message: 'Cadastro criado com sucesso.',
    });
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
      include: userInclude,
    });

    if (!user || user.role !== role) {
      return res.status(401).json({ error: 'E-mail, senha ou perfil inválido.' });
    }

    if (user.deletedAt || user.status === 'deleted') {
      return res.status(401).json({ error: 'Conta excluída.' });
    }

    let userForSession = user;
    if (user.status === 'pending') {
      userForSession = await prisma.user.update({
        where: { id: user.id },
        data: {
          status: 'active',
          verificationCode: null,
          verificationExpiresAt: null,
        },
        include: userInclude,
      });
    }

    if (userForSession.status !== 'active') {
      return res.status(403).json({ error: 'Conta indisponível para acesso.' });
    }

    const passwordMatches = await bcrypt.compare(password, userForSession.password);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'E-mail, senha ou perfil inválido.' });
    }

    const token = signToken(userForSession);
    res.json({ token, user: sanitizeUser(userForSession) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/demo', async (req, res) => {
  const { role = 'comprador' } = req.body;

  if (!isValidRole(role)) {
    return res.status(400).json({ error: 'Perfil demo inválido.' });
  }

  try {
    const user = await ensureDemoUser(role);
    const token = signToken(user);

    res.json({
      token,
      user: sanitizeUser(user),
      credentials: {
        email: user.email,
        password: DEMO_PASSWORD,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/social/chat', authenticateToken, async (req, res) => {
  try {
    const conversationId = req.user.id;
    const count = await prisma.chatMessage.count({ where: { conversationId } });
    const seller = await prisma.sellerProfile.findFirst({
      where: { deletedAt: null, user: { is: { deletedAt: null, status: 'active' } } },
      orderBy: { createdAt: 'desc' },
    });
    const sellerName = seller?.name ?? 'UniEats';
    const userName = sanitizeUser(req.user).name;

    if (count === 0) {
      await prisma.chatMessage.createMany({
        data: [
          {
            conversationId,
            senderRole: 'seller',
            senderName: sellerName,
            text: `Oi, ${userName.split(' ')[0]}! Pode mandar sua dúvida sobre os produtos por aqui.`,
          },
          {
            conversationId,
            senderRole: 'seller',
            senderName: sellerName,
            text: 'Se quiser reservar algo, eu te oriento a finalizar pelo carrinho para o pedido ficar registrado.',
          },
        ],
      });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    res.json(messages);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/social/chat', authenticateToken, async (req, res) => {
  const text = String(req.body.text ?? '').trim();

  if (!text) {
    return res.status(400).json({ error: 'Digite uma mensagem.' });
  }

  try {
    const conversationId = req.user.id;
    const userName = sanitizeUser(req.user).name;
    await prisma.chatMessage.create({
      data: {
        conversationId,
        senderRole: 'user',
        senderName: userName,
        text,
      },
    });

    const products = await prisma.product.findMany({
      where: {
        seller: {
          is: {
            deletedAt: null,
            storeOpen: true,
            user: { is: { deletedAt: null, status: 'active' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 2,
      include: productInclude,
    });
    const seller = products[0]?.seller ?? await prisma.sellerProfile.findFirst({
      where: { deletedAt: null, user: { is: { deletedAt: null, status: 'active' } } },
      orderBy: { createdAt: 'desc' },
    });

    await prisma.chatMessage.create({
      data: {
        conversationId,
        senderRole: 'seller',
        senderName: seller?.name ?? 'UniEats',
        text: buildChatReply(text, products),
      },
    });

    const messages = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    res.status(201).json(messages);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/sellers', async (req, res) => {
  try {
    const sellers = await prisma.sellerProfile.findMany({
      where: {
        deletedAt: null,
        user: { is: { deletedAt: null, status: 'active' } },
      },
      include: {
        user: { select: { id: true, email: true, deletedAt: true, status: true } },
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(sellers.map((seller) => ({
      ...serializeSellerProfile(seller),
      productCount: seller._count.products,
    })));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const currentUser = await getOptionalUser(req);
    const canSeeOwnClosedProducts = currentUser?.role === 'vendedor';
    const ownSellerId = currentUser?.sellerProfile?.id;
    const where = canSeeOwnClosedProducts
      ? {
          OR: [
            {
              seller: {
                is: {
                  storeOpen: true,
                  deletedAt: null,
                  user: { is: { deletedAt: null, status: 'active' } },
                },
              },
            },
            ...(ownSellerId ? [{ sellerId: ownSellerId }] : []),
          ],
        }
      : {
          seller: {
            is: {
              storeOpen: true,
              deletedAt: null,
              user: { is: { deletedAt: null, status: 'active' } },
            },
          },
        };

    const products = await prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: { createdAt: 'desc' },
    });
    res.json(products.map(serializeProduct));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/products', authenticateToken, async (req, res) => {
  if (req.user.role !== 'vendedor') {
    return res.status(403).json({ error: 'Apenas vendedores podem cadastrar produtos.' });
  }

  if (!req.user.sellerProfile || req.user.sellerProfile.deletedAt) {
    return res.status(403).json({ error: 'Perfil de vendedor não encontrado.' });
  }

  const { title, description, price, category, stock, imageUrl } = req.body;
  const parsedPrice = Number.parseFloat(price);
  const parsedStock = Number.parseInt(stock, 10);
  const nextImageUrl = imageUrl === undefined ? undefined : normalizeOptionalUrl(imageUrl);

  if (!title || !description || !category || !parsedPrice || parsedPrice <= 0 || !parsedStock || parsedStock <= 0) {
    return res.status(400).json({ error: 'Informe título, descrição, categoria, preço e estoque válidos.' });
  }

  if (imageUrl !== undefined && nextImageUrl === undefined) {
    return res.status(400).json({ error: 'Informe uma URL ou arquivo de imagem válido.' });
  }

  try {
    const product = await prisma.product.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        price: parsedPrice,
        category: category.trim(),
        stock: parsedStock,
        imageUrl: nextImageUrl ?? null,
        sellerId: req.user.sellerProfile.id,
      },
      include: productInclude,
    });

    res.status(201).json(serializeProduct(product));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/cart', authenticateToken, async (req, res) => {
  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: { product: { include: productInclude } },
      orderBy: { id: 'asc' },
    });
    res.json(cartItems.map(serializeCartItem));
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
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: productInclude,
    });
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    if (!product.seller.storeOpen || product.seller.deletedAt || product.seller.user?.deletedAt || product.seller.user?.status !== 'active') {
      return res.status(400).json({ error: 'Esta loja está fechada no momento.' });
    }

    if (parsedQuantity > product.stock) {
      return res.status(400).json({ error: 'Quantidade maior que o estoque disponível.' });
    }

    const cartItem = await prisma.cartItem.upsert({
      where: { userId_productId: { userId: req.user.id, productId } },
      update: { quantity: parsedQuantity },
      create: { userId: req.user.id, productId, quantity: parsedQuantity },
      include: { product: { include: productInclude } },
    });

    res.json(serializeCartItem(cartItem));
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

  if (!req.user.buyerProfile || req.user.buyerProfile.deletedAt) {
    return res.status(403).json({ error: 'Perfil de comprador não encontrado.' });
  }

  const { deliveryPoint, paymentMethod } = req.body;

  if (!deliveryPoint || !paymentMethod) {
    return res.status(400).json({ error: 'Informe ponto de entrega e forma de pagamento.' });
  }

  try {
    const createdOrder = await prisma.$transaction(async (tx) => {
      const cartItems = await tx.cartItem.findMany({
        where: { userId: req.user.id },
        include: { product: { include: productInclude } },
      });

      if (cartItems.length === 0) {
        throw new Error('Carrinho vazio.');
      }

      const sellerIds = new Set(cartItems.map((item) => item.product.sellerId));
      if (sellerIds.size > 1) {
        throw new Error('Finalize pedidos de vendedores diferentes separadamente.');
      }

      for (const item of cartItems) {
        if (!item.product.seller.storeOpen || item.product.seller.deletedAt || item.product.seller.user?.deletedAt || item.product.seller.user?.status !== 'active') {
          throw new Error(`A loja de ${item.product.title} está fechada no momento.`);
        }

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
          buyerId: req.user.buyerProfile.id,
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
        include: orderInclude,
      });
    });

    res.status(201).json(serializeOrder(createdOrder));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const isSeller = req.query.seller === 'true';
    const sellerId = req.user.sellerProfile?.id;
    const buyerId = req.user.buyerProfile?.id;
    const where = isSeller ? { sellerId } : { buyerId };

    if ((isSeller && !sellerId) || (!isSeller && !buyerId)) {
      return res.json([]);
    }

    const orders = await prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders.map(serializeOrder));
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

    if (existingOrder.sellerId !== req.user.sellerProfile?.id) {
      return res.status(403).json({ error: 'Apenas o vendedor deste pedido pode atualizar o status.' });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: orderInclude,
    });
    res.json(serializeOrder(order));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.patch('/api/orders/:id/review', authenticateToken, async (req, res) => {
  if (req.user.role !== 'comprador') {
    return res.status(403).json({ error: 'Entre como comprador para avaliar pedidos.' });
  }

  const { id } = req.params;
  const rating = Number.parseInt(req.body.rating, 10);
  const reviewComment = String(req.body.reviewComment ?? '').trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Informe uma nota de 1 a 5.' });
  }

  try {
    const existingOrder = await prisma.order.findUnique({ where: { id } });

    if (!existingOrder) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    if (existingOrder.buyerId !== req.user.buyerProfile?.id) {
      return res.status(403).json({ error: 'Apenas o consumidor deste pedido pode avaliar.' });
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        rating,
        reviewComment: reviewComment || null,
      },
      include: orderInclude,
    });

    res.json(serializeOrder(order));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

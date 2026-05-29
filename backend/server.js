const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  const { email, role, name, phone, matricula, curso, universidade } = req.body;
  try {
    const hashedPassword = await bcrypt.hash('defaultpassword', 10); // For demo, use a default password
    const user = await prisma.user.create({
      data: {
        email,
        role,
        name,
        phone,
        matricula,
        curso,
        universidade,
        password: hashedPassword,
      },
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, role } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== role) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'secret');
    res.json({ token, user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Shop routes
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({ include: { seller: true } });
    res.json(products);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/products', authenticateToken, async (req, res) => {
  const { title, description, price, category, stock } = req.body;
  try {
    const product = await prisma.product.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        category,
        stock: parseInt(stock),
        sellerId: req.user.id,
      },
    });
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/cart', authenticateToken, async (req, res) => {
  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: { product: true },
    });
    res.json(cartItems);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/cart', authenticateToken, async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    const cartItem = await prisma.cartItem.upsert({
      where: { userId_productId: { userId: req.user.id, productId } },
      update: { quantity: parseInt(quantity) },
      create: { userId: req.user.id, productId, quantity: parseInt(quantity) },
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
    res.json({ message: 'Removed from cart' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/orders', authenticateToken, async (req, res) => {
  const { deliveryPoint, paymentMethod } = req.body;
  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: { product: true },
    });

    if (cartItems.length === 0) return res.status(400).json({ error: 'Cart is empty' });

    const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    const order = await prisma.order.create({
      data: {
        buyerId: req.user.id,
        sellerId: cartItems[0].product.sellerId, // Assuming single seller for simplicity
        total,
        deliveryPoint,
        paymentMethod,
        items: {
          create: cartItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          })),
        },
      },
    });

    // Clear cart
    await prisma.cartItem.deleteMany({ where: { userId: req.user.id } });

    res.json(order);
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
    });
    res.json(orders);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.patch('/api/orders/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
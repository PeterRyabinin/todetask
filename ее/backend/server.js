// Simplified Express server
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
const fs = require('fs');
const path = require('path');

const SECRET = process.env.JWT_SECRET || 'change_this_secret_in_prod';
const app = express();
app.use(cors());
app.use(bodyParser.json());

const initSql = fs.readFileSync(path.join(__dirname, 'init-db.sql'), 'utf8');
initSql.split(/;\s*\n/).forEach(stmt => { if (stmt.trim()) db.prepare(stmt).run(); });

function generateToken(user){
  return jwt.sign({ id: user.id, username: user.username, is_admin: !!user.is_admin }, SECRET, { expiresIn: '7d' });
}

function authMiddleware(req, res, next){
  const header = req.headers.authorization;
  if(!header) return res.status(401).json({ error: 'No token' });
  const token = header.replace('Bearer ', '');
  try{
    const payload = jwt.verify(token, SECRET);
    req.user = payload;
    next();
  }catch(e){
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function adminOnly(req, res, next){
  if(req.user && req.user.is_admin) return next();
  return res.status(403).json({ error: 'Admins only' });
}

// Register
app.post('/api/register', async (req,res)=>{
  const { username, password } = req.body;
  if(!username || !password) return res.status(400).json({ error: 'Missing fields' });
  const hash = await bcrypt.hash(password, 10);
  try{
    const info = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hash);
    const user = { id: info.lastInsertRowid, username, is_admin: 0 };
    const token = generateToken(user);
    db.prepare('INSERT INTO carts (user_id) VALUES (?)').run(user.id);
    res.json({ token, user });
  }catch(e){
    res.status(400).json({ error: 'User exists' });
  }
});

// Login
app.post('/api/login', async (req,res)=>{
  const { username, password } = req.body;
  if(!username || !password) return res.status(400).json({ error: 'Missing fields' });
  const row = db.prepare('SELECT id, username, password_hash, is_admin FROM users WHERE username = ?').get(username);
  if(!row) return res.status(400).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, row.password_hash);
  if(!ok) return res.status(400).json({ error: 'Invalid credentials' });
  const user = { id: row.id, username: row.username, is_admin: !!row.is_admin };
  const token = generateToken(user);
  res.json({ token, user });
});

// Products list
app.get('/api/products', (req,res)=>{
  const rows = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  res.json(rows);
});

// Admin add product
app.post('/api/products', authMiddleware, adminOnly, (req,res)=>{
  const { title, description, price, image } = req.body;
  if(!title || !price) return res.status(400).json({ error: 'Missing fields' });
  const info = db.prepare('INSERT INTO products (title, description, price, image) VALUES (?, ?, ?, ?)')
    .run(title, description || '', price, image || '');
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
  res.json(product);
});

// Cart endpoints
app.get('/api/cart', authMiddleware, (req,res)=>{
  const cart = db.prepare('SELECT id FROM carts WHERE user_id = ?').get(req.user.id);
  if(!cart) return res.json({ items: [] });
  const items = db.prepare(`SELECT ci.id, ci.quantity, p.* FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.cart_id = ?`).all(cart.id);
  res.json({ items });
});

app.post('/api/cart/add', authMiddleware, (req,res)=>{
  const { product_id, quantity } = req.body;
  const q = Number(quantity) || 1;
  const cart = db.prepare('SELECT id FROM carts WHERE user_id = ?').get(req.user.id);
  if(!cart) return res.status(500).json({ error: 'Cart not found' });
  const existing = db.prepare('SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?').get(cart.id, product_id);
  if(existing){
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(existing.quantity + q, existing.id);
  }else{
    db.prepare('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)').run(cart.id, product_id, q);
  }
  const items = db.prepare(`SELECT ci.id, ci.quantity, p.* FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.cart_id = ?`).all(cart.id);
  res.json({ items });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=> console.log('Server listening on', PORT));
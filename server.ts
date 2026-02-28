import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const db = new Database('fesa.db');
const JWT_SECRET = process.env.JWT_SECRET || 'fesa-super-secret-key';

// --- Database Initialization ---
db.exec(`
  DROP TABLE IF EXISTS transactions;
  DROP TABLE IF EXISTS ads;
  DROP TABLE IF EXISTS users;
  DROP TABLE IF EXISTS categories;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    fullName TEXT,
    phone TEXT,
    walletBalance REAL DEFAULT 0,
    adminLevel INTEGER DEFAULT 0,
    profilePicture TEXT,
    bio TEXT,
    onlineStatus TEXT DEFAULT 'offline',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    price REAL,
    location TEXT,
    category TEXT,
    author_id INTEGER,
    images TEXT, -- JSON array
    expiry_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(author_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amount REAL,
    type TEXT,
    status TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Seed categories
const insertCat = db.prepare('INSERT INTO categories (name) VALUES (?)');
['Bricolage', 'Ménage', 'Cours particuliers', 'Informatique', 'Livraison', 'Beauté', 'Santé', 'Déménagement'].forEach(name => {
  insertCat.run(name);
});

// --- Middleware ---
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const isAdmin = (req: any, res: any, next: any) => {
  const user = db.prepare('SELECT adminLevel FROM users WHERE id = ?').get(req.user.id) as any;
  if (user && user.adminLevel >= 1) {
    next();
  } else {
    res.status(403).json({ error: 'Accès administrateur requis' });
  }
};

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // --- Auth Routes ---
  app.post('/api/auth/register', async (req, res) => {
    const { email, password, fullName, phone } = req.body;
    try {
      const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
      const adminLevel = userCount === 0 ? 2 : 0; // First user is SuperAdmin

      const hashedPassword = await bcrypt.hash(password, 10);
      const result = db.prepare('INSERT INTO users (email, password, fullName, phone, adminLevel) VALUES (?, ?, ?, ?, ?)').run(email, hashedPassword, fullName, phone, adminLevel);
      const user = db.prepare('SELECT id, email, fullName, phone, walletBalance, adminLevel, profilePicture, bio, onlineStatus, created_at FROM users WHERE id = ?').get(result.lastInsertRowid) as any;
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
      res.json({ token, user });
    } catch (err: any) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        res.status(400).json({ error: 'Cet email est déjà utilisé.' });
      } else {
        res.status(500).json({ error: 'Erreur lors de l\'inscription.' });
      }
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  });

  app.put('/api/auth/profile', authenticateToken, (req: any, res: any) => {
    const { fullName, phone, profilePicture, onlineStatus, bio } = req.body;
    db.prepare('UPDATE users SET fullName = ?, phone = ?, profilePicture = ?, onlineStatus = ?, bio = ? WHERE id = ?')
      .run(fullName, phone, profilePicture, onlineStatus, bio, req.user.id);
    res.json({ success: true });
  });

  // --- Ad Routes ---
  app.get('/api/ads', (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const countResult = db.prepare("SELECT COUNT(*) as count FROM ads WHERE expiry_date > datetime('now')").get() as any;
    const totalAds = countResult.count;
    const totalPages = Math.ceil(totalAds / limit);

    const ads = db.prepare(`
      SELECT ads.*, users.fullName as author 
      FROM ads 
      JOIN users ON ads.author_id = users.id 
      WHERE expiry_date > datetime('now')
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset).map((ad: any) => ({
      ...ad,
      images: JSON.parse(ad.images || '[]')
    }));

    res.json({
      ads,
      pagination: {
        currentPage: page,
        totalPages,
        totalAds,
        limit
      }
    });
  });

  app.get('/api/ads/me', authenticateToken, (req: any, res: any) => {
    const ads = db.prepare('SELECT * FROM ads WHERE author_id = ? ORDER BY created_at DESC').all(req.user.id).map((ad: any) => ({
      ...ad,
      images: JSON.parse(ad.images || '[]')
    }));
    res.json(ads);
  });

  app.post('/api/ads', authenticateToken, (req: any, res: any) => {
    const { title, description, price, location, category, images, planId } = req.body;
    
    // Pricing logic
    const plans: Record<string, { days: number, cost: number }> = {
      '7days': { days: 7, cost: 500 },
      '30days': { days: 30, cost: 1500 },
      '90days': { days: 90, cost: 4000 }
    };

    const plan = plans[planId] || plans['7days'];
    const user = db.prepare('SELECT walletBalance FROM users WHERE id = ?').get(req.user.id) as any;

    if (user.walletBalance < plan.cost) {
      return res.status(400).json({ error: 'Solde insuffisant pour publier cette annonce.' });
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + plan.days);

    const transaction = db.transaction(() => {
      db.prepare('UPDATE users SET walletBalance = walletBalance - ? WHERE id = ?').run(plan.cost, req.user.id);
      db.prepare('INSERT INTO transactions (user_id, amount, type, status, description) VALUES (?, ?, ?, ?, ?)')
        .run(req.user.id, plan.cost, 'payment', 'completed', `Publication annonce: ${title}`);
      
      const result = db.prepare('INSERT INTO ads (title, description, price, location, category, author_id, images, expiry_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(title, description, price, location, category, req.user.id, JSON.stringify(images || []), expiryDate.toISOString());
      
      return result.lastInsertRowid;
    });

    try {
      transaction();
      const updatedUser = db.prepare('SELECT walletBalance FROM users WHERE id = ?').get(req.user.id) as any;
      res.json({ success: true, newBalance: updatedUser.walletBalance });
    } catch (err) {
      res.status(500).json({ error: 'Erreur lors de la publication.' });
    }
  });

  // --- Wallet Routes ---
  app.get('/api/wallet/transactions', authenticateToken, (req: any, res: any) => {
    const txs = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json(txs);
  });

  app.post('/api/wallet/deposit', authenticateToken, (req: any, res: any) => {
    const { amount, phone, provider } = req.body;
    // Simulate Mobile Money payment
    const transaction = db.transaction(() => {
      db.prepare('UPDATE users SET walletBalance = walletBalance + ? WHERE id = ?').run(amount, req.user.id);
      db.prepare('INSERT INTO transactions (user_id, amount, type, status, description) VALUES (?, ?, ?, ?, ?)')
        .run(req.user.id, amount, 'deposit', 'completed', `Rechargement via ${provider} (${phone})`);
    });

    transaction();
    const user = db.prepare('SELECT walletBalance FROM users WHERE id = ?').get(req.user.id) as any;
    res.json({ balance: user.walletBalance });
  });

  // --- Admin Routes ---
  app.get('/api/categories', (req, res) => {
    const cats = db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
    res.json(cats);
  });

  app.post('/api/categories', authenticateToken, isAdmin, (req: any, res: any) => {
    const { name } = req.body;
    try {
      db.prepare('INSERT INTO categories (name) VALUES (?)').run(name);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: 'Cette catégorie existe déjà.' });
    }
  });

  app.delete('/api/categories/:id', authenticateToken, isAdmin, (req: any, res: any) => {
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.get('/api/admin/users', authenticateToken, isAdmin, (req: any, res: any) => {
    const users = db.prepare('SELECT id, email, fullName, phone, walletBalance, adminLevel, created_at FROM users').all();
    res.json(users);
  });

  app.put('/api/admin/users/:id/role', authenticateToken, isAdmin, (req: any, res: any) => {
    const { adminLevel } = req.body;
    const targetId = parseInt(req.params.id);
    
    // Security: Only SuperAdmin (2) can make others SuperAdmin
    const currentUser = db.prepare('SELECT adminLevel FROM users WHERE id = ?').get(req.user.id) as any;
    if (adminLevel === 2 && currentUser.adminLevel < 2) {
      return res.status(403).json({ error: 'Seul un SuperAdmin peut nommer un autre SuperAdmin' });
    }

    db.prepare('UPDATE users SET adminLevel = ? WHERE id = ?').run(adminLevel, targetId);
    res.json({ success: true });
  });

  app.get('/api/admin/ads', authenticateToken, isAdmin, (req: any, res: any) => {
    const ads = db.prepare(`
      SELECT ads.*, users.fullName as author 
      FROM ads 
      JOIN users ON ads.author_id = users.id 
      ORDER BY created_at DESC
    `).all().map((ad: any) => ({
      ...ad,
      images: JSON.parse(ad.images || '[]')
    }));
    res.json(ads);
  });

  app.put('/api/admin/ads/:id', authenticateToken, isAdmin, (req: any, res: any) => {
    const { title, description, price, location, category, expiryDate } = req.body;
    db.prepare('UPDATE ads SET title = ?, description = ?, price = ?, location = ?, category = ?, expiry_date = ? WHERE id = ?')
      .run(title, description, price, location, category, expiryDate, req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/admin/ads/:id', authenticateToken, isAdmin, (req: any, res: any) => {
    db.prepare('DELETE FROM ads WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.get('/api/admin/stats', authenticateToken, isAdmin, (req: any, res: any) => {
    const adsByCategory = db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM ads 
      GROUP BY category
    `).all();

    const activeAdsCount = (db.prepare("SELECT COUNT(*) as count FROM ads WHERE expiry_date > datetime('now')").get() as any).count;
    const totalAdsCount = (db.prepare("SELECT COUNT(*) as count FROM ads").get() as any).count;
    const activationRate = totalAdsCount > 0 ? (activeAdsCount / totalAdsCount) * 100 : 0;

    const stats = {
      revenue: {
        day: (db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'payment' AND date(created_at) = date('now')").get() as any).total || 0,
        month: (db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'payment' AND strftime('%m', created_at) = strftime('%m', 'now')").get() as any).total || 0,
        year: (db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'payment' AND strftime('%Y', created_at) = strftime('%Y', 'now')").get() as any).total || 0,
      },
      counts: {
        users: (db.prepare("SELECT COUNT(*) as count FROM users").get() as any).count,
        ads: totalAdsCount,
        visitors: Math.floor(Math.random() * 100) + 50, // Simulated
        online: (db.prepare("SELECT COUNT(*) as count FROM users WHERE onlineStatus = 'online'").get() as any).count,
      },
      adsByCategory,
      activationRate
    };
    res.json(stats);
  });

  // --- Vite Setup ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

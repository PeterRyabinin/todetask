const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-secret-key-here';

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('../frontend'));

// Database file path
const DB_PATH = path.join(__dirname, 'database.json');

// Initialize database
const initializeDB = () => {
    if (!fs.existsSync(DB_PATH)) {
        const initialData = {
            users: [
                {
                    id: 1,
                    email: 'admin@marketplace.com',
                    password: bcrypt.hashSync('admin123', 10),
                    name: 'Administrator',
                    role: 'admin',
                    cart: []
                }
            ],
            products: [
                {
                    id: 1,
                    name: 'iPhone 14',
                    price: 999,
                    description: 'Latest Apple smartphone',
                    category: 'Electronics',
                    image: 'https://via.placeholder.com/200',
                    stock: 10,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    name: 'MacBook Pro',
                    price: 1999,
                    description: 'Powerful laptop for professionals',
                    category: 'Electronics',
                    image: 'https://via.placeholder.com/200',
                    stock: 5,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 3,
                    name: 'Nike Air Max',
                    price: 120,
                    description: 'Comfortable running shoes',
                    category: 'Fashion',
                    image: 'https://via.placeholder.com/200',
                    stock: 20,
                    createdAt: new Date().toISOString()
                }
            ],
            orders: []
        };
        fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
    }
};

// Read database
const readDB = () => {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
};

// Write to database
const writeDB = (data) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

// Auth middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Routes

// Register
app.post('/api/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const db = readDB();

        // Check if user exists
        if (db.users.find(user => user.email === email)) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Create new user
        const newUser = {
            id: db.users.length + 1,
            email,
            password: await bcrypt.hash(password, 10),
            name,
            role: 'user',
            cart: [],
            createdAt: new Date().toISOString()
        };

        db.users.push(newUser);
        writeDB(db);

        const token = jwt.sign(
            { id: newUser.id, email: newUser.email, role: newUser.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                role: newUser.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = readDB();

        const user = db.users.find(user => user.email === email);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get products
app.get('/api/products', (req, res) => {
    const db = readDB();
    res.json(db.products);
});

// Add product (admin only)
app.post('/api/products', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const user = db.users.find(u => u.id === req.user.id);

        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { name, price, description, category, image, stock } = req.body;

        const newProduct = {
            id: db.products.length + 1,
            name,
            price: parseFloat(price),
            description,
            category,
            image: image || 'https://via.placeholder.com/200',
            stock: parseInt(stock),
            createdAt: new Date().toISOString()
        };

        db.products.push(newProduct);
        writeDB(db);

        res.json(newProduct);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add to cart
app.post('/api/cart', authenticateToken, (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const db = readDB();

        const userIndex = db.users.findIndex(u => u.id === req.user.id);
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        const product = db.products.find(p => p.id === productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const cartItemIndex = db.users[userIndex].cart.findIndex(
            item => item.productId === productId
        );

        if (cartItemIndex > -1) {
            db.users[userIndex].cart[cartItemIndex].quantity += quantity;
        } else {
            db.users[userIndex].cart.push({
                productId,
                quantity,
                addedAt: new Date().toISOString()
            });
        }

        writeDB(db);
        res.json(db.users[userIndex].cart);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Remove from cart
app.delete('/api/cart/:productId', authenticateToken, (req, res) => {
    try {
        const { productId } = req.params;
        const db = readDB();

        const userIndex = db.users.findIndex(u => u.id === req.user.id);
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        db.users[userIndex].cart = db.users[userIndex].cart.filter(
            item => item.productId !== parseInt(productId)
        );

        writeDB(db);
        res.json(db.users[userIndex].cart);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get cart
app.get('/api/cart', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const user = db.users.find(u => u.id === req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const cartWithProducts = user.cart.map(item => {
            const product = db.products.find(p => p.id === item.productId);
            return {
                ...item,
                product: product || null
            };
        });

        res.json(cartWithProducts);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user profile
app.get('/api/profile', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const user = db.users.find(u => u.id === req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin stats
app.get('/api/admin/stats', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const user = db.users.find(u => u.id === req.user.id);

        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const stats = {
            totalUsers: db.users.length,
            totalProducts: db.products.length,
            totalOrders: db.orders.length,
            recentUsers: db.users.slice(-5).map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                createdAt: u.createdAt
            })),
            recentProducts: db.products.slice(-5)
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

// Добавим в server.js после существующих маршрутов:

// Update product (admin only)
app.put('/api/products/:id', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const user = db.users.find(u => u.id === req.user.id);

        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const productId = parseInt(req.params.id);
        const productIndex = db.products.findIndex(p => p.id === productId);

        if (productIndex === -1) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const { name, price, description, category, image, stock } = req.body;

        db.products[productIndex] = {
            ...db.products[productIndex],
            name: name || db.products[productIndex].name,
            price: price ? parseFloat(price) : db.products[productIndex].price,
            description: description || db.products[productIndex].description,
            category: category || db.products[productIndex].category,
            image: image || db.products[productIndex].image,
            stock: stock ? parseInt(stock) : db.products[productIndex].stock,
            updatedAt: new Date().toISOString()
        };

        writeDB(db);
        res.json(db.products[productIndex]);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete product (admin only)
app.delete('/api/products/:id', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const user = db.users.find(u => u.id === req.user.id);

        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const productId = parseInt(req.params.id);
        const productIndex = db.products.findIndex(p => p.id === productId);

        if (productIndex === -1) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Remove product from all users' carts
        db.users.forEach(user => {
            user.cart = user.cart.filter(item => item.productId !== productId);
        });

        const deletedProduct = db.products.splice(productIndex, 1)[0];
        writeDB(db);

        res.json({ message: 'Product deleted successfully', product: deletedProduct });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create order
app.post('/api/orders', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const userIndex = db.users.findIndex(u => u.id === req.user.id);

        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = db.users[userIndex];
        
        if (user.cart.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Calculate total and prepare order items
        let total = 0;
        const orderItems = user.cart.map(item => {
            const product = db.products.find(p => p.id === item.productId);
            if (product) {
                const itemTotal = product.price * item.quantity;
                total += itemTotal;
                return {
                    productId: item.productId,
                    productName: product.name,
                    quantity: item.quantity,
                    price: product.price,
                    total: itemTotal
                };
            }
            return null;
        }).filter(item => item !== null);

        const newOrder = {
            id: db.orders.length + 1,
            userId: user.id,
            items: orderItems,
            total: total,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        db.orders.push(newOrder);

        // Clear user's cart
        db.users[userIndex].cart = [];

        writeDB(db);
        res.json(newOrder);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Initialize and start server
initializeDB();
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
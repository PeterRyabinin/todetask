const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const dbPath = path.join(__dirname, '../database/db.json');
const JWT_SECRET = 'your-secret-key';

// Чтение базы данных
const readDB = () => {
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
};

// Запись в базу данных
const writeDB = (data) => {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

// Middleware для проверки авторизации
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Неверный токен' });
        }
        req.user = user;
        next();
    });
};

// Получение корзины пользователя
router.get('/', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const userCart = db.carts.find(cart => cart.userId === req.user.userId);
        
        if (!userCart) {
            return res.json({ items: [], total: 0 });
        }
        
        // Расчет общей суммы
        const total = userCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        res.json({ items: userCart.items, total });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Добавление товара в корзину
router.post('/add', authenticateToken, (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const db = readDB();
        
        // Поиск товара
        const product = db.products.find(p => p.id === parseInt(productId));
        if (!product) {
            return res.status(404).json({ error: 'Товар не найден' });
        }
        
        // Поиск корзины пользователя
        let userCart = db.carts.find(cart => cart.userId === req.user.userId);
        
        if (!userCart) {
            // Создание новой корзины
            userCart = {
                userId: req.user.userId,
                items: []
            };
            db.carts.push(userCart);
        }
        
        // Проверка наличия товара в корзине
        const existingItem = userCart.items.find(item => item.productId === parseInt(productId));
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            userCart.items.push({
                productId: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: quantity
            });
        }
        
        writeDB(db);
        res.json({ message: 'Товар добавлен в корзину' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Удаление товара из корзины
router.delete('/remove/:productId', authenticateToken, (req, res) => {
    try {
        const db = readDB();
        const userCart = db.carts.find(cart => cart.userId === req.user.userId);
        
        if (!userCart) {
            return res.status(404).json({ error: 'Корзина не найдена' });
        }
        
        // Удаление товара
        userCart.items = userCart.items.filter(item => item.productId !== parseInt(req.params.productId));
        writeDB(db);
        
        res.json({ message: 'Товар удален из корзины' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;
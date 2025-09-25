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

// Middleware для проверки админских прав
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Неверный токен' });
        }
        
        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Недостаточно прав' });
        }
        
        req.user = user;
        next();
    });
};

// Добавление нового товара
router.post('/products', authenticateAdmin, (req, res) => {
    try {
        const { name, price, category, image, description } = req.body;
        const db = readDB();
        
        // Валидация
        if (!name || !price || !category) {
            return res.status(400).json({ error: 'Заполните обязательные поля: название, цена, категория' });
        }
        
        // Создание нового товара
        const newProduct = {
            id: db.products.length > 0 ? Math.max(...db.products.map(p => p.id)) + 1 : 1,
            name,
            price: parseFloat(price),
            category,
            image: image || 'https://via.placeholder.com/200',
            description: description || ''
        };
        
        db.products.push(newProduct);
        writeDB(db);
        
        res.json({ 
            message: 'Товар успешно добавлен', 
            product: newProduct 
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Удаление товара
router.delete('/products/:id', authenticateAdmin, (req, res) => {
    try {
        const db = readDB();
        const productId = parseInt(req.params.id);
        
        const productIndex = db.products.findIndex(p => p.id === productId);
        if (productIndex === -1) {
            return res.status(404).json({ error: 'Товар не найден' });
        }
        
        // Удаление товара
        const deletedProduct = db.products.splice(productIndex, 1)[0];
        writeDB(db);
        
        res.json({ 
            message: 'Товар успешно удален', 
            product: deletedProduct 
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получение списка всех пользователей (только для админа)
router.get('/users', authenticateAdmin, (req, res) => {
    try {
        const db = readDB();
        const users = db.users.map(user => ({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        }));
        
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;
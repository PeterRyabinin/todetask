const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const dbPath = path.join(__dirname, '../database/db.json');

// Чтение базы данных
const readDB = () => {
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
};

// Получение всех товаров
router.get('/', (req, res) => {
    try {
        const db = readDB();
        res.json(db.products);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получение товара по ID
router.get('/:id', (req, res) => {
    try {
        const db = readDB();
        const product = db.products.find(p => p.id === parseInt(req.params.id));
        
        if (!product) {
            return res.status(404).json({ error: 'Товар не найден' });
        }
        
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;
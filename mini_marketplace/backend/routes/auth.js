const express = require('express');
const bcrypt = require('bcryptjs');
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

// Регистрация
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const db = readDB();
        
        // Проверка существования пользователя
        const existingUser = db.users.find(user => user.email === email);
        if (existingUser) {
            return res.status(400).json({ error: 'Пользователь уже существует' });
        }
        
        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Создание нового пользователя
        const newUser = {
            id: db.users.length + 1,
            email,
            password: hashedPassword,
            name
        };
        
        db.users.push(newUser);
        writeDB(db);
        
        // Создание JWT токена
        const token = jwt.sign({ userId: newUser.id }, JWT_SECRET);
        
        res.json({ 
            message: 'Регистрация успешна', 
            token,
            user: { id: newUser.id, email: newUser.email, name: newUser.name }
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Авторизация
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = readDB();
        
        // Поиск пользователя
        const user = db.users.find(user => user.email === email);
        if (!user) {
            return res.status(400).json({ error: 'Неверный email или пароль' });
        }
        
        // Проверка пароля
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Неверный email или пароль' });
        }
        
        // Создание JWT токена
        const token = jwt.sign({ userId: user.id }, JWT_SECRET);
        
        res.json({ 
            message: 'Авторизация успешна', 
            token,
            user: { id: user.id, email: user.email, name: user.name }
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;
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
        const token = jwt.sign({ userId: newUser.id, role: newUser.role }, JWT_SECRET);
        
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
// В функции login, временно для отладки:
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('Попытка входа:', email, password); // Добавляем лог
        
        const db = readDB();
        const user = db.users.find(user => user.email === email);
        
        if (!user) {
            console.log('Пользователь не найден');
            return res.status(400).json({ error: 'Пользователь не найден' });
        }
        
        console.log('Найден пользователь:', user);
        
        // Временная проверка для отладки
        if (password === '1111' && email === 'admin@example.com') {
            console.log('Вход по упрощенной проверке');
            const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET);
            return res.json({ 
                message: 'Авторизация успешна (упрощенная)', 
                token,
                user: { 
                    id: user.id, 
                    email: user.email, 
                    name: user.name,
                    role: user.role 
                }
            });
        }
        
        const validPassword = await bcrypt.compare(password, user.password);
        console.log('Проверка пароля:', validPassword);
        
        if (!validPassword) {
            return res.status(400).json({ error: 'Неверный пароль' });
        }
        
        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET);
        
        res.json({ 
            message: 'Авторизация успешна', 
            token,
            user: { 
                id: user.id, 
                email: user.email, 
                name: user.name,
                role: user.role 
            }
        });
        
    } catch (error) {
        console.error('Ошибка авторизации:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});


module.exports = router;
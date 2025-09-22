const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'your-secret-key-here';

// Middleware
app.use(express.json());
app.use(express.static('public'));

// File paths
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const TODOS_FILE = path.join(__dirname, 'data', 'todos.json');

// Ensure data directory and files exist
const ensureDataFiles = () => {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }
    
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify([]));
    }
    
    if (!fs.existsSync(TODOS_FILE)) {
        fs.writeFileSync(TODOS_FILE, JSON.stringify([]));
    }
};

// Read/write helper functions
const readUsers = () => {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

const writeUsers = (users) => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

const readTodos = () => {
    try {
        const data = fs.readFileSync(TODOS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

const writeTodos = (todos) => {
    fs.writeFileSync(TODOS_FILE, JSON.stringify(todos, null, 2));
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

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Register
app.post('/api/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;
        
        if (!username || !password || !email) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const users = readUsers();
        
        // Check if user exists
        if (users.find(user => user.username === username)) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        if (users.find(user => user.email === email)) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const newUser = {
            id: uuidv4(),
            username,
            email,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        writeUsers(users);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const users = readUsers();
        const user = users.find(u => u.username === username);
        
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user todos
app.get('/api/todos', authenticateToken, (req, res) => {
    try {
        const todos = readTodos();
        const userTodos = todos.filter(todo => todo.userId === req.user.id);
        res.json(userTodos);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create todo
app.post('/api/todos', authenticateToken, (req, res) => {
    try {
        const { title, description } = req.body;
        
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const todos = readTodos();
        const newTodo = {
            id: uuidv4(),
            userId: req.user.id,
            title,
            description: description || '',
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        todos.push(newTodo);
        writeTodos(todos);

        res.status(201).json(newTodo);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update todo
app.put('/api/todos/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, completed } = req.body;

        const todos = readTodos();
        const todoIndex = todos.findIndex(todo => todo.id === id && todo.userId === req.user.id);
        
        if (todoIndex === -1) {
            return res.status(404).json({ error: 'Todo not found' });
        }

        if (title !== undefined) todos[todoIndex].title = title;
        if (description !== undefined) todos[todoIndex].description = description;
        if (completed !== undefined) todos[todoIndex].completed = completed;
        
        todos[todoIndex].updatedAt = new Date().toISOString();
        writeTodos(todos);

        res.json(todos[todoIndex]);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete todo
app.delete('/api/todos/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;

        const todos = readTodos();
        const todoIndex = todos.findIndex(todo => todo.id === id && todo.userId === req.user.id);
        
        if (todoIndex === -1) {
            return res.status(404).json({ error: 'Todo not found' });
        }

        todos.splice(todoIndex, 1);
        writeTodos(todos);

        res.json({ message: 'Todo deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Initialize data files and start server
ensureDataFiles();

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
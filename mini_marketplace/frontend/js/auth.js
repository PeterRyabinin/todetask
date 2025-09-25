const API_BASE = 'http://localhost:3000/api';

let currentUser = null;
let token = localStorage.getItem('token');

// Показать/скрыть секции
function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.getElementById(`${sectionName}-section`).classList.add('active');
    
    if (sectionName === 'products') {
        loadProducts();
    } else if (sectionName === 'cart') {
        loadCart();
    }
}

// Проверка авторизации
function checkAuth() {
    if (token) {
        currentUser = JSON.parse(localStorage.getItem('user'));
        updateAuthUI();
        showSection('products');
    } else {
        showSection('login');
    }
}

// Обновление UI в зависимости от авторизации
function updateAuthUI() {
    const authSection = document.getElementById('auth-section');
    const userSection = document.getElementById('user-section');
    const userName = document.getElementById('user-name');
    
    if (currentUser) {
        authSection.style.display = 'none';
        userSection.style.display = 'block';
        userName.textContent = currentUser.name;
    } else {
        authSection.style.display = 'block';
        userSection.style.display = 'none';
    }
}

// Регистрация
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('reg-name').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value
    };
    
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            token = data.token;
            currentUser = data.user;
            updateAuthUI();
            showSection('products');
            alert('Регистрация успешна!');
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Ошибка при регистрации');
    }
});

// Авторизация
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value
    };
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            token = data.token;
            currentUser = data.user;
            updateAuthUI();
            showSection('products');
            alert('Вход выполнен успешно!');
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Ошибка при входе');
    }
});

// Выход
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    token = null;
    currentUser = null;
    updateAuthUI();
    showSection('login');
}

// Инициализация
document.addEventListener('DOMContentLoaded', checkAuth);
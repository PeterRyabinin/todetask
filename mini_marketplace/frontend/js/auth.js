const API_BASE = 'http://localhost:3000/api';

let currentUser = null;
let token = localStorage.getItem('token');

// Инициализация при загрузке страницы
async function initializeApp() {
    if (token) {
        await verifyToken();
    } else {
        showSection('login');
    }
}

// Проверка токена при загрузке страницы
async function verifyToken() {
    try {
        const response = await fetch(`${API_BASE}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.valid) {
            currentUser = data.user;
            localStorage.setItem('user', JSON.stringify(currentUser));
            updateAuthUI();
            showSection('products');
        } else {
            // Токен невалиден, очищаем localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            token = null;
            currentUser = null;
            updateAuthUI();
            showSection('login');
            alert('Сессия истекла. Пожалуйста, войдите снова.');
        }
    } catch (error) {
        console.error('Ошибка проверки токена:', error);
        // В случае ошибки сети показываем логин форму
        showSection('login');
    }
}

// Показать/скрыть секции
function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Проверяем права доступа к админ-панели
    if (sectionName === 'admin') {
        if (!currentUser || currentUser.role !== 'admin') {
            alert('Доступ запрещен! Недостаточно прав.');
            showSection('products');
            return;
        }
    }
    
    const section = document.getElementById(`${sectionName}-section`);
    if (section) {
        section.classList.add('active');
    }
    
    // Загружаем данные для секции
    if (sectionName === 'products') {
        loadProducts();
    } else if (sectionName === 'cart') {
        loadCart();
    } else if (sectionName === 'admin' && currentUser && currentUser.role === 'admin') {
        openAdminTab('add-product');
    }
}

// Обновление UI в зависимости от авторизации
function updateAuthUI() {
    const authSection = document.getElementById('auth-section');
    const userSection = document.getElementById('user-section');
    const userName = document.getElementById('user-name');
    const navLinks = document.querySelector('.nav-links');
    
    // Удаляем существующую ссылку на админ-панель
    const existingAdminLink = document.querySelector('a[onclick="showAdminPanel()"]');
    if (existingAdminLink) {
        existingAdminLink.remove();
    }
    
    if (currentUser) {
        authSection.style.display = 'none';
        userSection.style.display = 'block';
        userName.textContent = currentUser.name;
        
        // Добавляем ссылку на админ-панель если пользователь админ
        if (currentUser.role === 'admin') {
            const adminLink = document.createElement('a');
            adminLink.href = '#';
            adminLink.textContent = 'Админ-панель';
            adminLink.onclick = () => showSection('admin');
            navLinks.insertBefore(adminLink, userSection);
        }
    } else {
        authSection.style.display = 'block';
        userSection.style.display = 'none';
    }
}

// Показать админ-панель
function showAdminPanel() {
    if (currentUser && currentUser.role === 'admin') {
        showSection('admin');
    } else {
        alert('Доступ запрещен! Недостаточно прав.');
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
            alert(`Ошибка: ${data.error}`);
        }
    } catch (error) {
        alert('Ошибка сети при регистрации');
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
            alert(`Добро пожаловать, ${data.user.name}!`);
        } else {
            alert(`Ошибка: ${data.error}`);
        }
    } catch (error) {
        alert('Ошибка сети при входе');
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
    alert('Вы вышли из системы');
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', initializeApp);
// admin.js - Функционал админ-панели

// Переключение вкладок админ-панели
function openAdminTab(tabName) {
    // Скрываем все вкладки
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Убираем активный класс у всех кнопок
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Показываем выбранную вкладку
    document.getElementById(tabName).classList.add('active');
    
    // Активируем кнопку
    event.target.classList.add('active');
    
    // Загружаем данные если необходимо
    if (tabName === 'manage-products') {
        loadAdminProducts();
    } else if (tabName === 'users') {
        loadUsers();
    }
}

// Добавление нового товара
document.getElementById('add-product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('product-name').value,
        price: parseFloat(document.getElementById('product-price').value),
        category: document.getElementById('product-category').value,
        image: document.getElementById('product-image').value,
        description: document.getElementById('product-description').value
    };
    
    try {
        const response = await fetch(`${API_BASE}/admin/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Товар успешно добавлен!');
            document.getElementById('add-product-form').reset();
            // Обновляем список товаров
            loadProducts();
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Ошибка при добавлении товара');
    }
});

// Загрузка товаров для админ-панели
async function loadAdminProducts() {
    try {
        const response = await fetch(`${API_BASE}/products`);
        const products = await response.json();
        
        displayAdminProducts(products);
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
    }
}

// Отображение товаров в админ-панели
function displayAdminProducts(products) {
    const container = document.getElementById('admin-products-list');
    container.innerHTML = '';
    
    if (products.length === 0) {
        container.innerHTML = '<p>Товаров нет</p>';
        return;
    }
    
    const grid = document.createElement('div');
    grid.className = 'admin-products-grid';
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'admin-product-card';
        productCard.innerHTML = `
            <h4>${product.name}</h4>
            <p><strong>Цена:</strong> $${product.price}</p>
            <p><strong>Категория:</strong> ${product.category}</p>
            <p><strong>ID:</strong> ${product.id}</p>
            <button class="delete-product-btn" onclick="deleteProduct(${product.id})">Удалить</button>
        `;
        grid.appendChild(productCard);
    });
    
    container.appendChild(grid);
}

// Удаление товара
async function deleteProduct(productId) {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/admin/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Товар успешно удален!');
            loadAdminProducts();
            loadProducts(); // Обновляем основной список товаров
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Ошибка при удалении товара');
    }
}

// Загрузка списка пользователей
async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE}/admin/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки пользователей');
        }
        
        const users = await response.json();
        displayUsers(users);
    } catch (error) {
        document.getElementById('users-list').innerHTML = '<p>Ошибка загрузки пользователей</p>';
    }
}

// Отображение списка пользователей
function displayUsers(users) {
    const container = document.getElementById('users-list');
    
    if (users.length === 0) {
        container.innerHTML = '<p>Пользователей нет</p>';
        return;
    }
    
    let html = `
        <table class="users-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Имя</th>
                    <th>Email</th>
                    <th>Роль</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    users.forEach(user => {
        html += `
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td class="role-${user.role}">${user.role === 'admin' ? 'Администратор' : 'Пользователь'}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// Обновляем функцию showSection для админ-панели
const originalShowSection = window.showSection;
window.showSection = function(sectionName) {
    originalShowSection(sectionName);
    
    if (sectionName === 'admin' && currentUser && currentUser.role === 'admin') {
        openAdminTab('add-product');
    }
};
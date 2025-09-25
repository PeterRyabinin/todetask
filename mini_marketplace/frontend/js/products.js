// Загрузка товаров
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE}/products`);
        const products = await response.json();
        
        displayProducts(products);
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
    }
}

// Отображение товаров
function displayProducts(products) {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="price">$${product.price}</div>
            <button onclick="addToCart(${product.id})">Добавить в корзину</button>
        `;
        grid.appendChild(productCard);
    });
}

// Добавление в корзину
async function addToCart(productId) {
    if (!token) {
        alert('Для добавления в корзину необходимо авторизоваться');
        showSection('login');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/cart/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ productId })
        });
        
        if (response.ok) {
            alert('Товар добавлен в корзину!');
            loadCart();
        } else {
            const data = await response.json();
            alert(data.error);
        }
    } catch (error) {
        alert('Ошибка при добавлении в корзину');
    }
}

// Обновляем функцию showSection в основном коде
function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Проверяем права доступа к админ-панели
    if (sectionName === 'admin' && (!currentUser || currentUser.role !== 'admin')) {
        alert('Доступ запрещен!');
        showSection('products');
        return;
    }
    
    document.getElementById(`${sectionName}-section`).classList.add('active');
    
    if (sectionName === 'products') {
        loadProducts();
    } else if (sectionName === 'cart') {
        loadCart();
    } else if (sectionName === 'admin') {
        openAdminTab('add-product');
    }
}
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
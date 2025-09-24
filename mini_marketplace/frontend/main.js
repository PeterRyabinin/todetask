// API base URL
const API_BASE = 'http://localhost:3000/api';

// Load featured products
async function loadFeaturedProducts() {
    try {
        const response = await fetch(`${API_BASE}/products`);
        const products = await response.json();
        
        const featuredContainer = document.getElementById('featured-products');
        if (featuredContainer) {
            featuredContainer.innerHTML = products.slice(0, 3).map(product => `
                <div class="product-card">
                    <img src="${product.image}" alt="${product.name}" class="product-image">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price">$${product.price}</div>
                    <p class="product-description">${product.description}</p>
                    <button class="btn btn-primary" onclick="addToCart(${product.id})">В корзину</button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Add to cart function
async function addToCart(productId) {
    if (!Auth.isLoggedIn()) {
        alert('Пожалуйста, войдите в систему чтобы добавить товар в корзину');
        window.location.href = 'login.html';
        return;
    }

    try {
        await Auth.makeAuthenticatedRequest(`${API_BASE}/cart`, {
            method: 'POST',
            body: JSON.stringify({ productId, quantity: 1 })
        });
        
        alert('Товар добавлен в корзину!');
    } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Ошибка при добавлении товара в корзину');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadFeaturedProducts();
});
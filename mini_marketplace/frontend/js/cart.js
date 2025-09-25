// Загрузка корзины
async function loadCart() {
    if (!token) {
        document.getElementById('cart-items').innerHTML = '<p>Для просмотра корзины необходимо авторизоваться</p>';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/cart`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const cart = await response.json();
        displayCart(cart);
    } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
    }
}

// Отображение корзины
function displayCart(cart) {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    if (cart.items.length === 0) {
        cartItems.innerHTML = '<p>Корзина пуста</p>';
        cartTotal.innerHTML = '';
        return;
    }
    
    cartItems.innerHTML = '';
    cart.items.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div>
                <h4>${item.name}</h4>
                <p>Цена: $${item.price} x ${item.quantity}</p>
            </div>
            <div>
                <strong>$${item.price * item.quantity}</strong>
                <button class="remove-btn" onclick="removeFromCart(${item.productId})">Удалить</button>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });
    
    cartTotal.innerHTML = `<div class="cart-total">Общая сумма: $${cart.total}</div>`;
}

// Удаление из корзины
async function removeFromCart(productId) {
    try {
        const response = await fetch(`${API_BASE}/cart/remove/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            alert('Товар удален из корзины');
            loadCart();
        } else {
            const data = await response.json();
            alert(data.error);
        }
    } catch (error) {
        alert('Ошибка при удалении из корзины');
    }
}
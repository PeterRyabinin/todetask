class Auth {
    static getToken() {
        return localStorage.getItem('token');
    }

    static setToken(token) {
        localStorage.setItem('token', token);
    }

    static getUser() {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
    }

    static setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    }

    static logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }

    static isLoggedIn() {
        return this.getToken() !== null;
    }

    static isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    }

    static async makeAuthenticatedRequest(url, options = {}) {
        const token = this.getToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        const response = await fetch(url, mergedOptions);
        
        if (response.status === 401) {
            this.logout();
            throw new Error('Authentication failed');
        }

        return response;
    }
}

// Update UI based on auth status
function updateAuthUI() {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const userName = document.getElementById('user-name');
    const adminLink = document.getElementById('admin-link');

    if (Auth.isLoggedIn()) {
        const user = Auth.getUser();
        authButtons.style.display = 'none';
        userMenu.style.display = 'flex';
        userName.textContent = `Привет, ${user.name}`;
        
        if (Auth.isAdmin()) {
            adminLink.style.display = 'inline';
        } else {
            adminLink.style.display = 'none';
        }
    } else {
        authButtons.style.display = 'flex';
        userMenu.style.display = 'none';
    }
}

// Logout functionality
document.addEventListener('DOMContentLoaded', function() {
    updateAuthUI();
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            Auth.logout();
        });
    }
});
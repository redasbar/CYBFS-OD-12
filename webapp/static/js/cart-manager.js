// cart-manager.js - Gestion avancée du panier

class CartManager {
    constructor() {
        this.cartKey = 'libratech_cart';
        this.cart = this.loadCart();
        this.init();
    }
    
    init() {
        this.renderCart();
        this.updateCartCount();
        this.setupEventListeners();
    }
    
    // Stockage Local
    loadCart() {
        const cartData = localStorage.getItem(this.cartKey);
        return cartData ? JSON.parse(cartData) : [];
    }
    
    saveCart() {
        localStorage.setItem(this.cartKey, JSON.stringify(this.cart));
        this.updateCartCount();
    }
    
    // Opérations du panier
    addItem(bookId, quantity = 1, properties = {}) {
        const existingItem = this.cart.find(item => item.bookId === bookId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                bookId: bookId,
                quantity: quantity,
                addedAt: new Date().toISOString(),
                ...properties
            });
        }
        
        this.saveCart();
        this.showMessage('Livre ajouté au panier !', 'success');
    }
    
    removeItem(bookId) {
        this.cart = this.cart.filter(item => item.bookId !== bookId);
        this.saveCart();
        this.showMessage('Livre retiré du panier', 'info');
        this.renderCart();
    }
    
    updateQuantity(bookId, quantity) {
        if (quantity <= 0) {
            this.removeItem(bookId);
            return;
        }
        
        const item = this.cart.find(item => item.bookId === bookId);
        if (item) {
            item.quantity = quantity;
            this.saveCart();
            this.renderCart();
        }
    }
    
    clearCart() {
        if (this.cart.length === 0) return;
        
        if (confirm('Vider tous les articles du panier ?')) {
            this.cart = [];
            this.saveCart();
            this.showMessage('Panier vidé', 'info');
            this.renderCart();
        }
    }
    
    getItemCount() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }
    
    // Récupération des détails
    async getCartDetails() {
        if (this.cart.length === 0) {
            return { items: [], subtotal: 0, tax: 0, total: 0, itemCount: 0 };
        }
        
        try {
            const bookIds = this.cart.map(item => item.bookId);
            const response = await fetch(`/api/cart/books?ids=${bookIds.join(',')}`);
            
            if (!response.ok) throw new Error('Failed to fetch cart details');
            
            const books = await response.json();
            
            const items = this.cart.map(cartItem => {
                const book = books.find(b => b.id === cartItem.bookId);
                return book ? {
                    ...cartItem,
                    book: book,
                    total: book.price * cartItem.quantity
                } : null;
            }).filter(item => item !== null);
            
            const subtotal = items.reduce((sum, item) => sum + item.total, 0);
            const shipping = subtotal > 25 ? 0 : 5.99;
            const tax = subtotal * 0.1;
            const total = subtotal + shipping + tax;
            
            return {
                items: items,
                subtotal: subtotal,
                shipping: shipping,
                tax: tax,
                total: total,
                itemCount: this.getItemCount()
            };
            
        } catch (error) {
            console.error('Error loading cart details:', error);
            return { items: [], subtotal: 0, tax: 0, total: 0, itemCount: 0 };
        }
    }
    
    // Rendu
    async renderCart() {
        const cartContainer = document.querySelector('.cart-items');
        const emptyCart = document.getElementById('empty-cart');
        const cartGrid = document.querySelector('.cart-grid');
        const orderSummary = document.getElementById('order-summary');
        
        if (!cartContainer) return;
        
        if (this.cart.length === 0) {
            // Afficher panier vide
            if (emptyCart) emptyCart.style.display = 'block';
            if (cartGrid) cartGrid.style.display = 'none';
            if (orderSummary) orderSummary.style.display = 'none';
            
            this.loadRecommendations();
            return;
        }
        
        // Cacher panier vide
        if (emptyCart) emptyCart.style.display = 'none';
        if (cartGrid) cartGrid.style.display = 'grid';
        if (orderSummary) orderSummary.style.display = 'block';
        
        // Afficher chargement
        cartContainer.innerHTML = this.getLoadingHTML();
        
        try {
            const cartDetails = await this.getCartDetails();
            this.renderCartItems(cartContainer, cartDetails.items);
            this.updateSummary(cartDetails);
            this.setupCartItemListeners();
        } catch (error) {
            this.showError(cartContainer);
        }
    }
    
    getLoadingHTML() {
        return `
            <div class="loading-cart">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Chargement de votre panier...</p>
            </div>
        `;
    }
    
    renderCartItems(container, items) {
        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-cart-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Impossible de charger les articles du panier.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = items.map(item => this.getCartItemHTML(item)).join('');
    }
    
    getCartItemHTML(item) {
        const isOutOfStock = item.book.stock < item.quantity;
        const isLowStock = item.book.stock < 5;
        
        return `
            <div class="cart-item" data-book-id="${item.bookId}">
                <div class="item-image">
                    <a href="/book/${item.book.id}">
                        <img src="${item.book.image || '/static/images/book-placeholder.jpg'}" 
                             alt="${item.book.title}">
                    </a>
                </div>
                
                <div class="item-details">
                    <h3>
                        <a href="/book/${item.book.id}">${item.book.title}</a>
                    </h3>
                    <p class="item-author">${item.book.author}</p>
                    <p class="item-stock ${isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : 'in-stock'}">
                        ${isOutOfStock ? `Seulement ${item.book.stock} disponible(s)` : 'En stock'}
                    </p>
                    
                    <div class="item-actions">
                        <button class="btn-wishlist" data-book-id="${item.bookId}">
                            <i class="far fa-heart"></i> Sauvegarder
                        </button>
                        <button class="btn-remove" data-book-id="${item.bookId}">
                            <i class="fas fa-trash"></i> Retirer
                        </button>
                    </div>
                </div>
                
                <div class="item-price">
                    <div class="price-quantity">
                        <div class="quantity-controls">
                            <button class="qty-btn minus" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                            <input type="number" value="${item.quantity}" 
                                   min="1" max="${item.book.stock || 99}">
                            <button class="qty-btn plus" ${item.quantity >= (item.book.stock || 99) ? 'disabled' : ''}>+</button>
                        </div>
                        <span class="unit-price">€${item.book.price.toFixed(2)} chacun</span>
                    </div>
                    <div class="item-total">€${item.total.toFixed(2)}</div>
                </div>
            </div>
        `;
    }
    
    updateSummary(details) {
        const elements = {
            'item-count': details.itemCount,
            'subtotal': `€${details.subtotal.toFixed(2)}`,
            'shipping': details.shipping === 0 ? 'GRATUITE' : `€${details.shipping.toFixed(2)}`,
            'tax': `€${details.tax.toFixed(2)}`,
            'total': `€${details.total.toFixed(2)}`
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
        
        this.updateCheckoutButton(details.items);
    }
    
    updateCheckoutButton(items) {
        const checkoutBtn = document.getElementById('checkout-btn');
        if (!checkoutBtn) return;
        
        const hasOutOfStock = items.some(item => item.book.stock < item.quantity);
        
        if (hasOutOfStock) {
            checkoutBtn.disabled = true;
            checkoutBtn.title = 'Certains articles sont en rupture de stock';
            checkoutBtn.style.opacity = '0.5';
            checkoutBtn.style.cursor = 'not-allowed';
        } else {
            checkoutBtn.disabled = false;
            checkoutBtn.removeAttribute('title');
            checkoutBtn.style.opacity = '1';
            checkoutBtn.style.cursor = 'pointer';
        }
    }
    
    // Écouteurs d'événements
    setupEventListeners() {
        // Vider panier
        const clearBtn = document.getElementById('clear-cart');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearCart());
        }
        
        // Code promo
        this.setupPromoCode();
    }
    
    setupCartItemListeners() {
        // Quantité
        document.querySelectorAll('.qty-btn').forEach(button => {
            button.addEventListener('click', (e) => this.handleQuantityChange(e));
        });
        
        document.querySelectorAll('.cart-item input[type="number"]').forEach(input => {
            input.addEventListener('change', (e) => this.handleQuantityInput(e));
        });
        
        // Retirer
        document.querySelectorAll('.btn-remove').forEach(button => {
            button.addEventListener('click', (e) => {
                const bookId = e.target.closest('.btn-remove').getAttribute('data-book-id');
                this.removeItem(bookId);
            });
        });
        
        // Liste de souhaits
        document.querySelectorAll('.btn-wishlist').forEach(button => {
            button.addEventListener('click', (e) => {
                const bookId = e.target.closest('.btn-wishlist').getAttribute('data-book-id');
                this.addToWishlist(bookId);
            });
        });
    }
    
    setupPromoCode() {
        const applyBtn = document.getElementById('apply-promo');
        const promoInput = document.getElementById('promo-code');
        
        if (applyBtn && promoInput) {
            applyBtn.addEventListener('click', () => this.applyPromoCode(promoInput.value));
            promoInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.applyPromoCode(promoInput.value);
            });
        }
        
        // Suggestions
        document.querySelectorAll('.promo-suggestion').forEach(suggestion => {
            suggestion.addEventListener('click', () => {
                const code = suggestion.getAttribute('data-code');
                if (promoInput) promoInput.value = code;
                this.applyPromoCode(code);
            });
        });
    }
    
    handleQuantityChange(e) {
        const cartItem = e.target.closest('.cart-item');
        const bookId = cartItem.getAttribute('data-book-id');
        const input = cartItem.querySelector('input[type="number"]');
        let quantity = parseInt(input.value);
        
        if (e.target.classList.contains('minus')) {
            quantity--;
        } else if (e.target.classList.contains('plus')) {
            quantity++;
        }
        
        this.updateQuantity(bookId, quantity);
    }
    
    handleQuantityInput(e) {
        const cartItem = e.target.closest('.cart-item');
        const bookId = cartItem.getAttribute('data-book-id');
        const quantity = parseInt(e.target.value);
        
        this.updateQuantity(bookId, quantity);
    }
    
    // Recommandations
    async loadRecommendations() {
        const container = document.getElementById('recommended-books');
        if (!container) return;
        
        try {
            const response = await fetch('/api/books?limit=4');
            if (!response.ok) throw new Error('Failed to load recommendations');
            
            const books = await response.json();
            container.innerHTML = books.map(book => this.getRecommendationHTML(book)).join('');
            
            this.setupRecommendationListeners();
        } catch (error) {
            console.error('Error loading recommendations:', error);
        }
    }
    
    getRecommendationHTML(book) {
        return `
            <div class="recommended-book">
                <div class="rec-image">
                    <img src="${book.image || '/static/images/book-placeholder.jpg'}" 
                         alt="${book.title}">
                </div>
                <div class="rec-info">
                    <h4>${book.title}</h4>
                    <p>${book.author}</p>
                    <div class="rec-price">€${book.price.toFixed(2)}</div>
                    <button class="btn-add-to-cart" data-book-id="${book.id}">
                        <i class="fas fa-cart-plus"></i> Ajouter au panier
                    </button>
                </div>
            </div>
        `;
    }
    
    setupRecommendationListeners() {
        document.querySelectorAll('.btn-add-to-cart').forEach(button => {
            button.addEventListener('click', (e) => {
                const bookId = e.target.closest('.btn-add-to-cart').getAttribute('data-book-id');
                this.addItem(bookId);
                this.renderCart();
            });
        });
    }
    
    // Utilitaires
    applyPromoCode(code) {
        if (!code.trim()) {
            this.showMessage('Veuillez entrer un code promo', 'error');
            return;
        }
        
        const validCodes = {
            'WELCOME10': { discount: 0.1, type: 'percentage' },
            'FREESHIP': { discount: 5.99, type: 'shipping' }
        };
        
        if (validCodes[code]) {
            this.showMessage(`Code promo "${code}" appliqué !`, 'success');
        } else {
            this.showMessage('Code promo invalide', 'error');
        }
    }
    
    addToWishlist(bookId) {
        // À implémenter avec l'API wishlist
        this.showMessage('Ajouté à la liste de souhaits !', 'success');
    }
    
    updateCartCount() {
        const count = this.getItemCount();
        const cartCountElement = document.querySelector('.cart-count');
        
        if (cartCountElement) {
            if (count > 0) {
                cartCountElement.textContent = count;
                cartCountElement.style.display = 'flex';
            } else {
                cartCountElement.style.display = 'none';
            }
        }
    }
    
    showMessage(message, type = 'info') {
        // Supprimer les messages existants
        document.querySelectorAll('.cart-message').forEach(msg => msg.remove());
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `cart-message ${type}`;
        messageDiv.textContent = message;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            setTimeout(() => messageDiv.remove(), 500);
        }, 3000);
    }
    
    showError(container) {
        container.innerHTML = `
            <div class="empty-cart-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Erreur de chargement. Veuillez réessayer.</p>
            </div>
        `;
    }
}

// Initialisation globale
if (document.querySelector('.cart-container')) {
    window.cartManager = new CartManager();
}

// Export pour une utilisation globale
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CartManager;
}
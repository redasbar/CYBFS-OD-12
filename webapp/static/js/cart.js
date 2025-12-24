// Cart functionality
class Cart {
    constructor() {
        this.items = this.loadCart();
        this.updateCartDisplay();
    }
    
    loadCart() {
        const cartData = localStorage.getItem('cart');
        return cartData ? JSON.parse(cartData) : [];
    }
    
    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.items));
        this.updateCartCount();
    }
    
    addItem(bookId, quantity = 1) {
        const existingItem = this.items.find(item => item.bookId === bookId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                bookId: bookId,
                quantity: quantity,
                addedAt: new Date().toISOString()
            });
        }
        
        this.saveCart();
        this.updateCartDisplay();
        showNotification('Book added to cart!', 'success');
    }
    
    removeItem(bookId) {
        this.items = this.items.filter(item => item.bookId !== bookId);
        this.saveCart();
        this.updateCartDisplay();
        showNotification('Book removed from cart', 'info');
    }
    
    updateQuantity(bookId, quantity) {
        if (quantity <= 0) {
            this.removeItem(bookId);
            return;
        }
        
        const item = this.items.find(item => item.bookId === bookId);
        if (item) {
            item.quantity = quantity;
            this.saveCart();
            this.updateCartDisplay();
        }
    }
    
    clearCart() {
        this.items = [];
        this.saveCart();
        this.updateCartDisplay();
    }
    
    getItemCount() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }
    
    getTotalPrice() {
        // This would need to fetch book prices from server
        // For now, return estimated total
        return this.items.length * 20; // Placeholder
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
        
        localStorage.setItem('cartCount', count);
    }
    
    updateCartDisplay() {
        // Update cart page if we're on it
        if (document.querySelector('.cart-page')) {
            this.renderCartPage();
        }
    }
    
    async renderCartPage() {
        const cartContainer = document.querySelector('.cart-items');
        const cartTotal = document.querySelector('.cart-total');
        
        if (!cartContainer) return;
        
        if (this.items.length === 0) {
            cartContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>Your cart is empty</h3>
                    <p>Add some books to get started!</p>
                    <a href="/books" class="btn btn-primary">Browse Books</a>
                </div>
            `;
            if (cartTotal) cartTotal.style.display = 'none';
            return;
        }
        
        // Fetch book details for items in cart
        try {
            const bookIds = this.items.map(item => item.bookId);
            const response = await fetch(`/api/cart/books?ids=${bookIds.join(',')}`);
            const books = await response.json();
            
            // Create cart items HTML
            cartContainer.innerHTML = this.items.map(item => {
                const book = books.find(b => b.id === item.bookId);
                if (!book) return '';
                
                return `
                    <div class="cart-item" data-book-id="${item.bookId}">
                        <img src="${book.image}" alt="${book.title}">
                        <div class="cart-item-info">
                            <h3><a href="/book/${book.id}">${book.title}</a></h3>
                            <p class="author">${book.author}</p>
                            <p class="price">${formatPrice(book.price)} each</p>
                        </div>
                        <div class="cart-item-quantity">
                            <button class="quantity-btn minus">-</button>
                            <input type="number" value="${item.quantity}" min="1" max="${book.stock || 10}">
                            <button class="quantity-btn plus">+</button>
                        </div>
                        <div class="cart-item-total">
                            ${formatPrice(book.price * item.quantity)}
                        </div>
                        <button class="cart-item-remove">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
            }).join('');
            
            // Calculate total
            const total = this.items.reduce((sum, item) => {
                const book = books.find(b => b.id === item.bookId);
                return sum + (book ? book.price * item.quantity : 0);
            }, 0);
            
            if (cartTotal) {
                cartTotal.innerHTML = `
                    <div class="total-summary">
                        <h3>Order Summary</h3>
                        <div class="total-line">
                            <span>Subtotal</span>
                            <span>${formatPrice(total)}</span>
                        </div>
                        <div class="total-line">
                            <span>Shipping</span>
                            <span>${total > 25 ? 'FREE' : '€5.00'}</span>
                        </div>
                        <div class="total-line total">
                            <span>Total</span>
                            <span>${formatPrice(total > 25 ? total : total + 5)}</span>
                        </div>
                        <a href="/checkout" class="btn btn-primary checkout-btn">Proceed to Checkout</a>
                    </div>
                `;
                cartTotal.style.display = 'block';
            }
            
            // Add event listeners
            this.addCartEventListeners();
            
        } catch (error) {
            console.error('Error loading cart:', error);
            cartContainer.innerHTML = '<div class="error">Error loading cart items</div>';
        }
    }
    
    addCartEventListeners() {
        // Quantity buttons
        document.querySelectorAll('.quantity-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const cartItem = e.target.closest('.cart-item');
                const bookId = cartItem.getAttribute('data-book-id');
                const input = cartItem.querySelector('input');
                let quantity = parseInt(input.value);
                
                if (e.target.classList.contains('plus')) {
                    quantity++;
                } else if (e.target.classList.contains('minus')) {
                    quantity--;
                }
                
                this.updateQuantity(bookId, quantity);
            });
        });
        
        // Quantity input changes
        document.querySelectorAll('.cart-item input').forEach(input => {
            input.addEventListener('change', (e) => {
                const cartItem = e.target.closest('.cart-item');
                const bookId = cartItem.getAttribute('data-book-id');
                const quantity = parseInt(e.target.value);
                
                this.updateQuantity(bookId, quantity);
            });
        });
        
        // Remove buttons
        document.querySelectorAll('.cart-item-remove').forEach(button => {
            button.addEventListener('click', (e) => {
                const cartItem = e.target.closest('.cart-item');
                const bookId = cartItem.getAttribute('data-book-id');
                
                this.removeItem(bookId);
            });
        });
    }
}

// Initialize cart
const cart = new Cart();

// Add to cart buttons
document.addEventListener('click', function(e) {
    if (e.target.closest('.btn-add-cart')) {
        const button = e.target.closest('.btn-add-cart');
        const bookId = button.getAttribute('data-book-id');
        
        if (!bookId) return;
        
        cart.addItem(bookId);
        
        // Add animation
        button.innerHTML = '<i class="fas fa-check"></i>';
        button.style.backgroundColor = 'var(--success-color)';
        
        setTimeout(() => {
            button.innerHTML = '<i class="fas fa-cart-plus"></i>';
            button.style.backgroundColor = '';
        }, 1000);
    }
});

// Clear cart button
document.addEventListener('click', function(e) {
    if (e.target.closest('.clear-cart-btn')) {
        if (confirm('Are you sure you want to clear your cart?')) {
            cart.clearCart();
        }
    }
});
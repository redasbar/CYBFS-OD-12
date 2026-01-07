// books-manager.js - Gestion des pages livres et détail

class BooksManager {
    constructor() {
        this.currentView = 'grid';
        this.currentSort = 'newest';
        this.init();
    }
    
    init() {
        this.setupViewToggle();
        this.setupSorting();
        this.setupFilters();
        this.setupBookDetail();
        this.setupTabs();
    }
    
    // Toggle vue grille/liste
    setupViewToggle() {
        const viewButtons = document.querySelectorAll('.view-btn');
        const booksView = document.getElementById('books-view');
        
        if (!viewButtons.length || !booksView) return;
        
        viewButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const viewType = e.target.closest('.view-btn').getAttribute('data-view');
                
                // Mettre à jour les boutons actifs
                viewButtons.forEach(btn => btn.classList.remove('active'));
                e.target.closest('.view-btn').classList.add('active');
                
                // Changer la vue
                this.currentView = viewType;
                if (viewType === 'list') {
                    booksView.classList.add('list-view');
                } else {
                    booksView.classList.remove('list-view');
                }
            });
        });
    }
    
    // Tri des livres
    setupSorting() {
        const sortDropdown = document.getElementById('sort');
        if (!sortDropdown) return;
        
        // Restaurer le tri précédent
        const savedSort = localStorage.getItem('books_sort');
        if (savedSort) {
            sortDropdown.value = savedSort;
            this.currentSort = savedSort;
        }
        
        sortDropdown.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            localStorage.setItem('books_sort', this.currentSort);
            this.applySorting();
        });
    }
    
    applySorting() {
        const bookCards = document.querySelectorAll('.book-card');
        if (!bookCards.length) return;
        
        const booksArray = Array.from(bookCards);
        const container = document.querySelector('.books-grid');
        
        booksArray.sort((a, b) => {
            switch(this.currentSort) {
                case 'title':
                    const titleA = a.querySelector('h3 a').textContent.toLowerCase();
                    const titleB = b.querySelector('h3 a').textContent.toLowerCase();
                    return titleA.localeCompare(titleB);
                    
                case 'price_low':
                    const priceA = this.extractPrice(a);
                    const priceB = this.extractPrice(b);
                    return priceA - priceB;
                    
                case 'price_high':
                    const priceHighA = this.extractPrice(a);
                    const priceHighB = this.extractPrice(b);
                    return priceHighB - priceHighA;
                    
                case 'popular':
                    // Simuler la popularité par rating
                    const ratingA = this.extractRating(a);
                    const ratingB = this.extractRating(b);
                    return ratingB - ratingA;
                    
                default: // newest
                    return 0; // Garder l'ordre d'origine
            }
        });
        
        // Réorganiser les cartes
        booksArray.forEach(card => container.appendChild(card));
    }
    
    extractPrice(card) {
        const priceText = card.querySelector('.book-price').textContent;
        return parseFloat(priceText.replace(/[^0-9.,]/g, '').replace(',', '.'));
    }
    
    extractRating(card) {
        const ratingElement = card.querySelector('.book-rating');
        if (!ratingElement) return 4.5; // Valeur par défaut
        const ratingText = ratingElement.textContent;
        return parseFloat(ratingText) || 4.5;
    }
    
    // Filtres
    setupFilters() {
        // Slider de prix
        const priceSlider = document.getElementById('priceRange');
        if (priceSlider) {
            priceSlider.addEventListener('input', (e) => {
                this.applyPriceFilter(e.target.value);
            });
        }
        
        // Filtres de stock
        const stockCheckboxes = document.querySelectorAll('.filter-checkbox input');
        stockCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.applyStockFilter());
        });
    }
    
    applyPriceFilter(maxPrice) {
        const bookCards = document.querySelectorAll('.book-card');
        bookCards.forEach(card => {
            const price = this.extractPrice(card);
            if (price <= maxPrice) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    applyStockFilter() {
        const inStockChecked = document.querySelector('input[type="checkbox"]:checked');
        const outOfStockChecked = document.querySelectorAll('input[type="checkbox"]:checked')[1];
        
        const bookCards = document.querySelectorAll('.book-card');
        bookCards.forEach(card => {
            const isOutOfStock = card.querySelector('.out-of-stock');
            
            if (inStockChecked && !outOfStockChecked) {
                // Afficher seulement en stock
                card.style.display = isOutOfStock ? 'none' : '';
            } else if (!inStockChecked && outOfStockChecked) {
                // Afficher seulement rupture de stock
                card.style.display = isOutOfStock ? '' : 'none';
            } else {
                // Afficher tout
                card.style.display = '';
            }
        });
    }
    
    // Gestion détail livre
    setupBookDetail() {
        // Changer image principale au clic sur miniatures
        document.querySelectorAll('.book-thumbnail').forEach(thumbnail => {
            thumbnail.addEventListener('click', (e) => {
                const mainImage = document.querySelector('.book-main-image img');
                const thumbnailImg = e.target.closest('.book-thumbnail').querySelector('img');
                
                if (mainImage && thumbnailImg) {
                    mainImage.src = thumbnailImg.src;
                    mainImage.alt = thumbnailImg.alt;
                    
                    // Mettre à jour les miniatures actives
                    document.querySelectorAll('.book-thumbnail').forEach(t => t.classList.remove('active'));
                    e.target.closest('.book-thumbnail').classList.add('active');
                }
            });
        });
        
        // Sélecteur de quantité
        const quantityInput = document.querySelector('.quantity-selector input');
        if (quantityInput) {
            const minusBtn = quantityInput.previousElementSibling;
            const plusBtn = quantityInput.nextElementSibling;
            
            if (minusBtn && minusBtn.classList.contains('qty-btn')) {
                minusBtn.addEventListener('click', () => {
                    const currentValue = parseInt(quantityInput.value) || 1;
                    if (currentValue > 1) {
                        quantityInput.value = currentValue - 1;
                    }
                });
            }
            
            if (plusBtn && plusBtn.classList.contains('qty-btn')) {
                plusBtn.addEventListener('click', () => {
                    const currentValue = parseInt(quantityInput.value) || 1;
                    const maxStock = parseInt(quantityInput.max) || 99;
                    if (currentValue < maxStock) {
                        quantityInput.value = currentValue + 1;
                    }
                });
            }
        }
        
        // Ajouter au panier depuis page détail
        const addToCartBtn = document.querySelector('.btn-add-cart-large');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => {
                const bookId = addToCartBtn.getAttribute('data-book-id');
                const quantity = parseInt(document.querySelector('.quantity-selector input').value) || 1;
                
                if (window.cartManager) {
                    window.cartManager.addItem(bookId, quantity);
                } else if (window.cart) {
                    window.cart.addItem(bookId, quantity);
                }
                
                // Animation de confirmation
                const originalText = addToCartBtn.innerHTML;
                addToCartBtn.innerHTML = '<i class="fas fa-check"></i> Ajouté !';
                addToCartBtn.style.backgroundColor = 'var(--success-color)';
                
                setTimeout(() => {
                    addToCartBtn.innerHTML = originalText;
                    addToCartBtn.style.backgroundColor = '';
                }, 2000);
            });
        }
        
        // Ajouter à la liste de souhaits
        const wishlistBtn = document.querySelector('.btn-wishlist-large');
        if (wishlistBtn) {
            wishlistBtn.addEventListener('click', () => {
                const bookId = addToCartBtn?.getAttribute('data-book-id');
                this.addToWishlist(bookId);
            });
        }
    }
    
    // Onglets page détail
    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        if (!tabButtons.length || !tabContents.length) return;
        
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabId = e.target.getAttribute('data-tab');
                
                // Changer boutons actifs
                tabButtons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                
                // Changer contenus actifs
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === tabId + '-content') {
                        content.classList.add('active');
                    }
                });
            });
        });
        
        // Activer le premier onglet par défaut
        if (tabButtons.length > 0 && tabContents.length > 0) {
            tabButtons[0].click();
        }
    }
    
    // Utilitaires
    addToWishlist(bookId) {
        // À implémenter avec l'API wishlist
        this.showMessage('Ajouté à la liste de souhaits !', 'success');
    }
    
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `books-message ${type}`;
        messageDiv.textContent = message;
        
        // Styles
        messageDiv.style.position = 'fixed';
        messageDiv.style.top = '20px';
        messageDiv.style.right = '20px';
        messageDiv.style.padding = '15px 20px';
        messageDiv.style.borderRadius = '8px';
        messageDiv.style.color = 'white';
        messageDiv.style.zIndex = '10000';
        messageDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        messageDiv.style.animation = 'slideIn 0.3s ease';
        
        if (type === 'success') {
            messageDiv.style.backgroundColor = 'var(--success-color)';
        } else if (type === 'error') {
            messageDiv.style.backgroundColor = 'var(--error-color)';
        } else {
            messageDiv.style.backgroundColor = 'var(--accent-color)';
        }
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            setTimeout(() => messageDiv.remove(), 500);
        }, 3000);
    }
}

// Initialisation
if (document.querySelector('.books-grid') || document.querySelector('.book-detail-container')) {
    document.addEventListener('DOMContentLoaded', () => {
        window.booksManager = new BooksManager();
    });
}
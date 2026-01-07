// books-manager.js - Gestion des pages livres et ajout panier

class BooksManager {
    constructor() {
        this.currentSort = 'newest';
        this.init();
    }

    init() {
        this.setupSorting();
        this.setupFilters();
        this.setupAddToCart();
    }

    // Tri
    setupSorting() {
        const sortDropdown = document.getElementById('sort');
        if (!sortDropdown) return;

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
        const bookCards = Array.from(document.querySelectorAll('.book-card'));
        const container = document.querySelector('.books-grid');
        if (!container) return;

        bookCards.sort((a, b) => {
            switch(this.currentSort) {
                case 'title':
                    return a.querySelector('h3 a').textContent.localeCompare(b.querySelector('h3 a').textContent);
                case 'price_low':
                    return this.getPrice(a) - this.getPrice(b);
                case 'price_high':
                    return this.getPrice(b) - this.getPrice(a);
                default:
                    return 0;
            }
        });

        bookCards.forEach(card => container.appendChild(card));
    }

    getPrice(card) {
        const priceText = card.querySelector('.book-price').textContent;
        return parseFloat(priceText.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
    }

    // Filtres
    setupFilters() {
        const priceSlider = document.getElementById('priceRange');
        const inStockCheckbox = document.getElementById('inStockFilter');
        const outOfStockCheckbox = document.getElementById('outOfStockFilter');

        const applyFilters = () => {
            const maxPrice = priceSlider ? parseFloat(priceSlider.value) : Infinity;
            const showInStock = inStockCheckbox ? inStockCheckbox.checked : true;
            const showOutStock = outOfStockCheckbox ? outOfStockCheckbox.checked : true;

            document.querySelectorAll('.book-card').forEach(card => {
                const price = this.getPrice(card);
                const outOfStock = card.classList.contains('out-of-stock'); // Ajouter cette classe si nécessaire
                let visible = price <= maxPrice;
                visible = visible && ((showInStock && !outOfStock) || (showOutStock && outOfStock));
                card.style.display = visible ? 'block' : 'none';
            });
        };

        if (priceSlider) priceSlider.addEventListener('input', applyFilters);
        if (inStockCheckbox) inStockCheckbox.addEventListener('change', applyFilters);
        if (outOfStockCheckbox) outOfStockCheckbox.addEventListener('change', applyFilters);
    }

    // Ajouter au panier
    setupAddToCart() {
        document.querySelectorAll('.btn-add-cart-small').forEach(btn => {
            btn.addEventListener('click', () => {
                const bookId = btn.getAttribute('data-book-id');
                const quantity = 1;

                if (window.cartManager) {
                    window.cartManager.addItem(bookId, quantity);
                } else if (window.cart) {
                    window.cart.addItem(bookId, quantity);
                }

                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i> Ajouté !';
                btn.style.backgroundColor = 'var(--success-color)';

                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.backgroundColor = '';
                }, 2000);
            });
        });
    }
}

// Initialisation
if (document.querySelector('.books-grid')) {
    document.addEventListener('DOMContentLoaded', () => {
        window.booksManager = new BooksManager();
    });
}

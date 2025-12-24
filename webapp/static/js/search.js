// Search functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    if (!searchInput || !searchResults) return;
    
    let searchTimeout;
    let currentSearch = '';
    
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        
        if (query === currentSearch) return;
        currentSearch = query;
        
        clearTimeout(searchTimeout);
        
        if (query.length < 2) {
            searchResults.style.display = 'none';
            return;
        }
        
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 300);
    });
    
    searchInput.addEventListener('focus', function() {
        if (this.value.trim().length >= 2 && searchResults.innerHTML) {
            searchResults.style.display = 'block';
        }
    });
    
    // Close search results when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchResults.contains(e.target) && e.target !== searchInput) {
            searchResults.style.display = 'none';
        }
    });
    
    // Handle keyboard navigation
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            searchResults.style.display = 'none';
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const firstResult = searchResults.querySelector('a');
            if (firstResult) firstResult.focus();
        }
    });
});

async function performSearch(query) {
    const searchResults = document.getElementById('search-results');
    
    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const results = await response.json();
        
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="no-results">No books found</div>';
        } else {
            searchResults.innerHTML = results.map(book => `
                <a href="/book/${book.id}" class="search-result">
                    <img src="${book.image}" alt="${book.title}">
                    <div class="result-info">
                        <h4>${book.title}</h4>
                        <p>${book.author}</p>
                        <span class="price">${formatPrice(book.price)}</span>
                    </div>
                </a>
            `).join('');
        }
        
        // Add styles to results
        const style = document.createElement('style');
        style.textContent = `
            .search-result {
                display: flex;
                align-items: center;
                padding: 10px;
                border-bottom: 1px solid #eee;
                text-decoration: none;
                color: #333;
                transition: background-color 0.2s;
            }
            
            .search-result:hover {
                background-color: #f5f5f5;
            }
            
            .search-result img {
                width: 40px;
                height: 40px;
                object-fit: cover;
                margin-right: 10px;
                border-radius: 4px;
            }
            
            .result-info h4 {
                margin: 0 0 5px 0;
                font-size: 14px;
                font-weight: bold;
            }
            
            .result-info p {
                margin: 0;
                font-size: 12px;
                color: #666;
            }
            
            .price {
                display: block;
                margin-top: 5px;
                font-weight: bold;
                color: #146eb4;
            }
            
            .no-results {
                padding: 20px;
                text-align: center;
                color: #666;
            }
        `;
        
        if (!document.querySelector('#search-results-style')) {
            style.id = 'search-results-style';
            document.head.appendChild(style);
        }
        
        searchResults.style.display = 'block';
        
    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = '<div class="no-results">Error loading results</div>';
        searchResults.style.display = 'block';
    }
}
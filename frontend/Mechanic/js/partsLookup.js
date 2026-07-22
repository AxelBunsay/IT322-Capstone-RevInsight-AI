// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('mechanicToken');
    const mechanic = localStorage.getItem('mechanic');
    
    if (!token || !mechanic) {
        window.location.href = 'mechanicLogin.html';
        return null;
    }
    
    return JSON.parse(mechanic);
}

// Logout function
function logout() {
    localStorage.removeItem('mechanicToken');
    localStorage.removeItem('mechanic');
    window.location.href = 'mechanicLogin.html';
}

// Sidebar toggle for mobile
function initSidebarToggle() {
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (!toggle) return;

    toggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
        toggle.classList.toggle('active');
    });

    // Close sidebar when clicking overlay
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        toggle.classList.remove('active');
    });

    // Close sidebar when clicking a nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
            toggle.classList.remove('active');
        });
    });
}

// Initialize sidebar toggle
initSidebarToggle();

let allParts = [];
let currentCategory = 'all';

// Category tab switching
document.querySelectorAll('.category-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentCategory = tab.getAttribute('data-category');
        filterAndDisplayParts();
    });
});

// Search and sort
document.getElementById('partsSearch').addEventListener('input', filterAndDisplayParts);
document.getElementById('sortSelect').addEventListener('change', filterAndDisplayParts);

function showToast(message, type = 'success') {
    const container = document.createElement('div');
    container.className = `toast ${type}`;
    container.innerHTML = `<span class="toast-icon">${type === 'success' ? '✓' : type === 'warning' ? '⚠' : '✕'}</span><span>${message}</span>`;
    document.body.appendChild(container);
    const toastContainer = document.body.querySelector('.toast-container') || (() => {
        const wrap = document.createElement('div');
        wrap.className = 'toast-container';
        document.body.appendChild(wrap);
        return wrap;
    })();
    toastContainer.appendChild(container);
    setTimeout(() => {
        container.style.animation = 'slideOutRight 0.25s ease';
        setTimeout(() => container.remove(), 250);
    }, 2800);
}

// Load parts from backend
async function loadParts() {
    const mechanic = checkAuth();
    if (!mechanic) return;
    
    try {
        const response = await fetch('https://it322-capstone-revinsight-ai.onrender.com/api/mechanic/parts', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('mechanicToken')}`
            }
        });
        
        if (response.ok) {
            allParts = await response.json();
            updateStats();
            filterAndDisplayParts();
        }
    } catch (error) {
        console.error('Error loading parts:', error);
        showToast('Could not load parts inventory.', 'error');
    }
}

// Update inventory statistics
function updateStats() {
    const available = allParts.filter(p => Number(p.stock) > 0 && Number(p.stock) > 5).length;
    const lowStock = allParts.filter(p => Number(p.stock) > 0 && Number(p.stock) <= 5).length;
    const outOfStock = allParts.filter(p => Number(p.stock) <= 0 || p.isOutOfStock).length;
    
    document.getElementById('availableCount').textContent = available;
    document.getElementById('lowStockCount').textContent = lowStock;
    document.getElementById('outOfStockCount').textContent = outOfStock;
}

// Filter and display parts
function filterAndDisplayParts() {
    const searchTerm = document.getElementById('partsSearch').value.toLowerCase();
    const sortValue = document.getElementById('sortSelect').value;
    
    let filtered = allParts;
    
    // Filter by category
    if (currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category.toLowerCase().includes(currentCategory));
    }
    
    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.itemId.toLowerCase().includes(searchTerm) ||
            p.name.toLowerCase().includes(searchTerm)
        );
    }
    
    // Sort
    filtered.sort((a, b) => {
        if (sortValue === 'name') {
            return a.name.localeCompare(b.name);
        } else if (sortValue === 'stock') {
            return b.stock - a.stock;
        } else if (sortValue === 'category') {
            return a.category.localeCompare(b.category);
        }
    });
    
    displayParts(filtered);
}

// Display parts in table
function displayParts(parts) {
    const tbody = document.getElementById('partsTableBody');
    const noResults = document.getElementById('noResults');
    
    if (!parts || parts.length === 0) {
        tbody.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    
    tbody.innerHTML = parts.map(part => {
        const imageUrl = part.image ? part.image : '';
        const isOutOfStock = Number(part.stock) <= 0 || part.isOutOfStock;
        const stockText = isOutOfStock ? 'Out of Stock' : `${part.stock}`;
        const stockClass = isOutOfStock ? 'out-of-stock-badge' : '';
        return `
            <tr>
                <td><span class="part-id">${part.itemId}</span></td>
                <td class="part-image">${imageUrl ? `<img src="${imageUrl}" alt="${part.name}" style="height:36px;border-radius:6px;">` : ''}</td>
                <td><span class="part-name">${part.name}</span></td>
                <td><span class="part-category">${part.category || '-'}</span></td>
                <td><span class="part-price">${part.price ? '₱' + part.price : '-'}</span></td>
                <td>
                    <span class="quantity ${stockClass}">${stockText}</span>
                </td>
            </tr>
        `;
    }).join('');
}

// Load parts on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadParts();
});

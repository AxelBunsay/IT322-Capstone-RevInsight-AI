const API_BASE = '/api';
const token = localStorage.getItem('customerToken');

const sampleProducts = [
  { id: '0011', name: 'Caban (Black)', desc: 'Durable black caban for motorcycle body protection. Scratch-resistant and lightweight.', price: 280, quantity: 15, category: 'Accessories', image: 'https://res.cloudinary.com/dcl8dksb0/image/upload/v1778335391/Screenshot_2026-05-09_220256_h68zbe.png' },
  { id: '0057', name: 'PIAA Horn', desc: 'High-quality PIAA motorcycle horn with superior sound clarity.', price: 700, quantity: 8, category: 'Accessories', image: 'https://res.cloudinary.com/dcl8dksb0/image/upload/v1778335391/Screenshot_2026-05-09_220256_h68zbe.png' },
  { id: '0015', name: 'Lamented (Tribal Blue)', desc: 'Eye-catching tribal blue laminated sticker, UV-resistant.', price: 300, quantity: 22, category: 'Accessories', image: 'https://res.cloudinary.com/dcl8dksb0/image/upload/v1778335391/Screenshot_2026-05-09_220256_h68zbe.png' },
  { id: '0058', name: 'CVT Cleaner', desc: 'Professional CVT belt and pulley cleaner. Improves belt life and performance.', price: 180, quantity: 3, category: 'Engine Parts', image: 'https://res.cloudinary.com/dcl8dksb0/image/upload/v1778335391/Screenshot_2026-05-09_220256_h68zbe.png' },
  { id: '0023', name: 'Engine Oil (1L)', desc: 'Premium fully synthetic engine oil. Provides superior engine protection.', price: 450, quantity: 20, category: 'Engine Parts', image: 'https://res.cloudinary.com/dcl8dksb0/image/upload/v1778335391/Screenshot_2026-05-09_220256_h68zbe.png' },
  { id: '0034', name: 'Brake Disc (Front)', desc: 'Heavy-duty front brake disc. Superior stopping power and heat dissipation.', price: 1200, quantity: 5, category: 'Brake Parts', image: 'https://res.cloudinary.com/dcl8dksb0/image/upload/v1778335391/Screenshot_2026-05-09_220256_h68zbe.png' },
  { id: '0045', name: 'Chain Lube', desc: 'O-ring safe chain lubricant. Protects against rust and reduces friction.', price: 180, quantity: 25, category: 'Engine Parts', image: 'https://res.cloudinary.com/dcl8dksb0/image/upload/v1778335391/Screenshot_2026-05-09_220256_h68zbe.png' },
  { id: '0062', name: 'LED Headlight', desc: 'High-output LED headlight with improved visibility.', price: 890, quantity: 6, category: 'Accessories', image: 'https://res.cloudinary.com/dcl8dksb0/image/upload/v1778335391/Screenshot_2026-05-09_220256_h68zbe.png' },
  { id: '0063', name: 'LED Tail Light', desc: 'Compact LED tail light with sharp beam.', price: 720, quantity: 11, category: 'Accessories', image: 'https://res.cloudinary.com/dcl8dksb0/image/upload/v1778335391/Screenshot_2026-05-09_220256_h68zbe.png' },
  { id: '0065', name: 'Motorcycle Helmet', desc: 'ECE-certified helmet with comfortable lining.', price: 1950, quantity: 6, category: 'Accessories', image: 'https://res.cloudinary.com/dcl8dksb0/image/upload/v1778335391/Screenshot_2026-05-09_220256_h68zbe.png' }
];

const pageSize = 6;
let currentPage = 1;
let products = [];
let filteredProducts = [];

const formatCurrency = (value) => '₱' + Number(value).toLocaleString('en-PH');

const getAuthHeaders = () => ({
  Authorization: token ? `Bearer ${token}` : '' ,
  'Content-Type': 'application/json'
});

const showLoginPrompt = () => {
  alert('Please sign in to use the cart.');
  window.location.href = '/Customer/userLogin.html';
};

const fetchProducts = async () => {
  try {
    const response = await fetch(`${API_BASE}/products`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to load products');
    }

    if (Array.isArray(data.products) && data.products.length > 0) {
      products = data.products.map((item) => ({
        ...item,
        quantity: item.quantity ?? item.stock ?? 0,
        image: item.image ?? item.img,
        _id: item._id || item.id
      }));
    } else {
      products = sampleProducts.map((item) => ({
        ...item,
        _id: item.id,
        quantity: item.quantity,
        image: item.image
      }));
    }

    filteredProducts = [...products];
    renderCategoryPills();
    renderProducts(1);
  } catch (error) {
    console.error(error);
    products = sampleProducts.map((item) => ({ ...item, _id: item.id, quantity: item.quantity, image: item.image }));
    filteredProducts = [...products];
    renderCategoryPills();
    renderProducts(1);
  }
};

const fetchCart = async () => {
  if (!token) return { items: [], totalPrice: 0 };
  const response = await fetch(`${API_BASE}/cart`, { headers: getAuthHeaders() });
  if (!response.ok) {
    return { items: [], totalPrice: 0 };
  }
  const data = await response.json();
  return data.cart || { items: [], totalPrice: 0 };
};

const addToCart = async (productId) => {
  if (!token) return showLoginPrompt();
  const response = await fetch(`${API_BASE}/cart/add`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ productId, quantity: 1 })
  });
  const data = await response.json();
  if (!response.ok) {
    alert(data.message || 'Unable to add item to cart');
    return;
  }
  await loadCart();
  alert('Added to cart.');
};

const removeFromCart = async (productId) => {
  if (!token) return showLoginPrompt();
  const response = await fetch(`${API_BASE}/cart/remove/${productId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    alert(data.message || 'Unable to remove item');
    return;
  }
  await loadCart();
};

const updateCartQuantity = async (productId, quantity) => {
  if (!token) return showLoginPrompt();
  const response = await fetch(`${API_BASE}/cart/update/${productId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ quantity })
  });
  const data = await response.json();
  if (!response.ok) {
    alert(data.message || 'Unable to update cart');
    return;
  }
  await loadCart();
};

const checkoutCart = async () => {
  if (!token) return showLoginPrompt();
  const response = await fetch(`${API_BASE}/orders/checkout`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({})
  });
  const data = await response.json();
  if (!response.ok) {
    alert(data.message || 'Checkout failed');
    return;
  }
  alert('Checkout complete!');
  await loadCart();
};

const renderProducts = (page = 1) => {
  const grid = document.getElementById('productsGrid');
  const info = document.getElementById('productsInfo');
  if (!grid) return;

  const total = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageItems = filteredProducts.slice(start, start + pageSize);

  grid.innerHTML = pageItems.map((p) => {
    const lowStock = p.quantity <= 5;
    const imageUrl = p.image || 'https://via.placeholder.com/400x250?text=No+Image';
    return `
      <div class="product-card">
        <div class="product-top">
          <div class="product-id">#${p._id.slice(-4)}</div>
          <span class="product-badge">${p.category}</span>
          ${lowStock ? '<span class="low-stock">Low Stock</span>' : ''}
          <img src="${imageUrl}" alt="${p.name}">
          <div class="card-icon">🛠</div>
        </div>
        <div class="product-body">
          <div class="product-title">${p.name}</div>
          <div class="product-desc">${p.desc || ''}</div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div class="product-price">${formatCurrency(p.price)}</div>
          </div>
          <div class="stock-row">
            <div class="stock-bar"><div class="stock-fill" style="width:${Math.max(6, Math.min(100, (p.quantity / 30) * 100))}%"></div></div>
            <div class="stock-count">${p.quantity} left</div>
          </div>
          <button class="add-btn" data-id="${p._id}">🛒 Add to Cart</button>
        </div>
      </div>
    `;
  }).join('');

  if (info) info.textContent = `${total} item${total === 1 ? '' : 's'} · page ${currentPage} of ${totalPages}`;
  renderPagination(totalPages);
};

const renderPagination = (totalPages) => {
  const el = document.getElementById('productsPagination');
  if (!el) return;
  el.innerHTML = '';
  if (totalPages <= 1) return;

  const makeBtn = (label, page, active = false) => {
    const b = document.createElement('button');
    b.textContent = label;
    if (active) b.classList.add('active');
    b.addEventListener('click', () => renderProducts(page));
    return b;
  };

  el.appendChild(makeBtn('←', Math.max(1, currentPage - 1)));
  for (let i = 1; i <= totalPages; i += 1) {
    el.appendChild(makeBtn(i, i, i === currentPage));
  }
  el.appendChild(makeBtn('→', Math.min(totalPages, currentPage + 1)));
};

const renderCategoryPills = () => {
  const categories = products.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  document.querySelectorAll('.pill').forEach((button) => {
    const cat = button.dataset.cat;
    const span = button.querySelector('.pill-count');
    if (span) {
      span.textContent = cat === 'all' ? products.length : (categories[cat] || 0);
    }
  });
};

const filterProducts = () => {
  const searchTerm = document.querySelector('.search-container .form-control').value.trim().toLowerCase();
  const activeCategory = Array.from(document.querySelectorAll('.pill')).find((p) => p.classList.contains('active'))?.dataset.cat || 'all';
  const filterValue = document.querySelector('.filter-dropdown').value;

  filteredProducts = products.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm) || item.category.toLowerCase().includes(searchTerm) || (item.desc || '').toLowerCase().includes(searchTerm);
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    let matchesPrice = true;
    if (filterValue) {
      const [min, max] = filterValue.includes('+') ? [Number(filterValue.replace('+', '')), Infinity] : filterValue.split('-').map(Number);
      matchesPrice = item.price >= min && (max === Infinity || item.price <= max);
    }
    return matchesSearch && matchesCategory && matchesPrice;
  });
  renderProducts(1);
};

const loadCart = async () => {
  const cart = await fetchCart();
  const itemsEl = document.getElementById('cartItems');
  const countEl = document.getElementById('cartItemCount');
  const totalEl = document.getElementById('cartTotal');
  const badge = document.getElementById('cartBadge');
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  countEl.textContent = `${itemCount} item${itemCount === 1 ? '' : 's'}`;
  totalEl.textContent = formatCurrency(cart.totalPrice);
  badge.textContent = itemCount;
  badge.hidden = itemCount === 0;

  if (!itemsEl) return;
  if (cart.items.length === 0) {
    itemsEl.innerHTML = '<p style="padding:24px; color:#555;">Your cart is empty.</p>';
    return;
  }

  itemsEl.innerHTML = cart.items.map((item) => `
    <div class="cart-item-card">
      <img src="${item.image || 'https://via.placeholder.com/120x90?text=No+Image'}" alt="${item.productName}" />
      <div class="cart-item-details">
        <div class="cart-item-title">${item.productName}</div>
        <div class="cart-item-meta">${formatCurrency(item.price)} × ${item.quantity}</div>
        <div class="cart-item-actions">
          <button class="cart-qty" data-id="${item.productId}" data-op="-">-</button>
          <span>${item.quantity}</span>
          <button class="cart-qty" data-id="${item.productId}" data-op="+">+</button>
          <button class="cart-remove" data-id="${item.productId}">Remove</button>
        </div>
      </div>
    </div>
  `).join('');
};

const openCart = () => {
  document.getElementById('cartDrawer').classList.add('open');
};

const closeCart = () => {
  document.getElementById('cartDrawer').classList.remove('open');
};

const setupPage = () => {
  document.querySelectorAll('.pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.pill').forEach((other) => other.classList.remove('active'));
      pill.classList.add('active');
      filterProducts();
    });
  });

  document.querySelector('.search-container .form-control').addEventListener('input', () => filterProducts());
  document.querySelector('.filter-dropdown').addEventListener('change', () => filterProducts());

  document.getElementById('productsGrid').addEventListener('click', async (event) => {
    const button = event.target.closest('.add-btn');
    if (!button) return;
    await addToCart(button.dataset.id);
  });

  const openCartButton = document.getElementById('openCartButton');
  const closeCartButton = document.getElementById('closeCartButton');
  const checkoutButton = document.getElementById('checkoutButton');
  const cartItemsContainer = document.getElementById('cartItems');

  if (openCartButton) {
    openCartButton.addEventListener('click', (event) => {
      event.preventDefault();
      if (!token) return showLoginPrompt();
      openCart();
    });
  }

  if (closeCartButton) {
    closeCartButton.addEventListener('click', closeCart);
  }

  if (checkoutButton) {
    checkoutButton.addEventListener('click', async () => {
      await checkoutCart();
      await loadCart();
    });
  }

  if (cartItemsContainer) {
    cartItemsContainer.addEventListener('click', async (event) => {
      const qtyButton = event.target.closest('.cart-qty');
      if (qtyButton) {
        const productId = qtyButton.dataset.id;
        const op = qtyButton.dataset.op;
        await adjustCartItem(productId, op);
        return;
      }
      const removeButton = event.target.closest('.cart-remove');
      if (removeButton) {
        await removeFromCart(removeButton.dataset.id);
      }
    });
  }
};

const adjustCartItem = async (productId, op) => {
  const cart = await fetchCart();
  const item = cart.items.find((entry) => entry.productId.toString() === productId.toString());
  if (!item) return;
  const newQuantity = op === '+' ? item.quantity + 1 : item.quantity - 1;
  if (newQuantity < 1) return removeFromCart(productId);
  await updateCartQuantity(productId, newQuantity);
};

document.addEventListener('DOMContentLoaded', async () => {
  if (!token) {
    document.getElementById('cartBadge').hidden = true;
  }
  setupPage();
  await fetchProducts();
  await loadCart();
});

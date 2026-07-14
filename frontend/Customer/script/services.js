// services.js - renders service cards with pagination
const sampleServices = [
  { id: 'SVC-01', title: 'Foam Seat Repair', desc: 'Professional foam seat repair for worn-out or damaged motorcycle seats. Restores comfort and shape.', price: 250, duration: '1-2 hrs', category: 'Seat Works', color: '#ffd966' },
  { id: 'SVC-02', title: 'Flat/Semi Seat Customization', desc: 'Custom flat or semi-flat seat fabrication tailored to your motorcycle.', price: 500, duration: '2-4 hrs', category: 'Seat Works', color: '#caa6ff' },
  { id: 'SVC-03', title: 'Indo Seat Customization', desc: 'Full indo-style seat customization with premium leatherette and foam.', price: 750, duration: '3-6 hrs', category: 'Seat Works', color: '#bff1d6' },
  { id: 'SVC-04', title: 'Change Oil', desc: 'Complete oil change service covering front shock oil, engine oil, and gear oil.', price: 150, duration: '30-45 min', category: 'Engine', color: '#ffd1d6' },
  { id: 'SVC-05', title: 'Chain and Sprocket Replacement', desc: 'Full chain and sprocket set replacement with proper tensioning and alignment.', price: 350, duration: '1-2 hrs', category: 'Drive', color: '#ffd1ea' },
  { id: 'SVC-06', title: 'Tune-up Service', desc: 'Comprehensive tune-up including spark plug change, air filter cleaning, idle adjustment.', price: 300, duration: '1-2 hrs', category: 'Engine', color: '#ccecff' },
  { id: 'SVC-07', title: 'Knuckle Bearing Replacement', desc: 'Replacement of worn knuckle bearings for smooth steering and handling.', price: 420, duration: '1-3 hrs', category: 'Drive', color: '#ffe4cc' },
  { id: 'SVC-08', title: 'Brake Repair/Replacement', desc: 'Full brake system inspection, repair, or replacement including pads, shoes, discs.', price: 280, duration: '45-90 min', category: 'Brakes', color: '#dff7e9' },
  { id: 'SVC-09', title: 'Engine Check-up', desc: 'Comprehensive engine diagnostic and inspection. Checks compression, timing, and injector performance.', price: 200, duration: '45-60 min', category: 'Engine', color: '#fff0b8' },
  { id: 'SVC-10', title: 'Engine Troubleshooting', desc: 'In-depth engine troubleshooting to identify and resolve starting issues and power loss.', price: 380, duration: '1-4 hrs', category: 'Engine', color: '#e8ddff' },
  { id: 'SVC-11', title: 'General Check-up', desc: 'Full motorcycle general check-up covering engine, brakes, tires, lights, and belts.', price: 180, duration: '45-60 min', category: 'Inspection', color: '#d9f7e9' },
  { id: 'SVC-12', title: 'Battery Services', desc: 'Battery inspection, terminal cleaning, load testing, and replacement service.', price: 150, duration: '30-45 min', category: 'Electrical', color: '#ffdbe0' },
];

const pageSize = 8;
let currentPage = 1;
let filtered = sampleServices.slice();
const token = localStorage.getItem('customerToken');

function renderServices() {
  const grid = document.getElementById('servicesGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const start = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);
  pageItems.forEach((svc) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-top" style="background:${svc.color};">
        <div class="product-badge">#${svc.id}</div>
        <div class="card-icon"><i class="bi bi-gear-fill"></i></div>
      </div>
      <div class="product-body">
        <div>
          <div class="product-title">${svc.title}</div>
          <div class="product-desc">${svc.desc}</div>
        </div>
        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:8px;">
          <div class="product-price">₱${svc.price}</div>
          <div class="stock-count">${svc.duration}</div>
        </div>
        <button class="add-btn" data-id="${svc.id}"><i class="bi bi-cart-plus"></i> Book Service</button>
      </div>
    `;
    grid.appendChild(card);
  });
  renderPagination();
}

function renderPagination() {
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const container = document.getElementById('servicesPagination');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 1; i <= pages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    if (i === currentPage) btn.classList.add('active');
    btn.onclick = () => { currentPage = i; renderServices(); };
    container.appendChild(btn);
  }
  const info = document.getElementById('servicesInfo');
  if (info) {
    info.textContent = `Showing ${Math.min((currentPage - 1) * pageSize + 1, total)}–${Math.min(currentPage * pageSize, total)} of ${total} services`;
  }
}

const showBookingMessage = (message, isError = false) => {
  const element = document.getElementById('bookingMessage');
  if (!element) return;
  element.style.display = 'block';
  element.style.color = isError ? '#b71c1c' : '#166534';
  element.textContent = message;
};

const bookService = async (serviceId) => {
  if (!token) {
    window.location.href = '/Customer/userLogin.html';
    return;
  }

  const service = sampleServices.find((item) => item.id === serviceId);
  if (!service) return;

  try {
    const response = await fetch('/api/service-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        serviceType: service.title,
        description: `${service.title} - ${service.desc}`
      })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Booking failed');
    }
    showBookingMessage(`Service booked successfully: ${service.title}`, false);
  } catch (error) {
    showBookingMessage(error.message || 'Unable to book service.', true);
  }
};

// search & filter
document.addEventListener('DOMContentLoaded', () => {
  renderServices();
  const search = document.getElementById('serviceSearch');
  if (search) {
    search.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      filtered = sampleServices.filter((s) => s.title.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q) || s.category.toLowerCase().includes(q));
      currentPage = 1;
      renderServices();
    });
  }

  const servicePills = document.getElementById('servicePills');
  if (servicePills) {
    servicePills.addEventListener('click', (e) => {
      const btn = e.target.closest('button.pill');
      if (!btn) return;
      document.querySelectorAll('#servicePills .pill').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      if (cat === 'all') filtered = sampleServices.slice(); else filtered = sampleServices.filter((s) => s.category === cat);
      currentPage = 1;
      renderServices();
    });
  }

  const grid = document.getElementById('servicesGrid');
  if (grid) {
    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('button.add-btn');
      if (!btn) return;
      bookService(btn.dataset.id);
    });
  }
});

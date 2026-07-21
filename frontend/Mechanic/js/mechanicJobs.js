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

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all tabs and contents
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked tab
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
        
        // Load data for the tab
        if (tabId === 'available') {
            loadAvailableJobs();
        } else if (tabId === 'assigned') {
            loadMyJobs();
        }
    });
});

let availableJobsCache = [];
let myJobsCache = [];

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

// Load available jobs
async function loadAvailableJobs() {
    const mechanic = checkAuth();
    if (!mechanic) return;
    
    try {
        const response = await fetch('http://localhost:5000/api/mechanic/jobs/available', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('mechanicToken')}`
            }
        });
        
        if (response.ok) {
            const jobs = await response.json();
            availableJobsCache = jobs || [];
            displayAvailableJobs(availableJobsCache);
            displayJobsOverview(availableJobsCache, myJobsCache);
        }
    } catch (error) {
        console.error('Error loading available jobs:', error);
        showToast('Unable to load jobs right now.', 'error');
    }
}

// Load assigned jobs
async function loadMyJobs() {
    const mechanic = checkAuth();
    if (!mechanic) return;
    
    try {
        const mechanicId = mechanic.id || mechanic._id;
        const response = await fetch(`http://localhost:5000/api/mechanic/${mechanicId}/jobs`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('mechanicToken')}`
            }
        });
        
        if (response.ok) {
            const jobs = await response.json();
            myJobsCache = jobs || [];
            displayMyJobs(myJobsCache);
            
            // Update badge count
            document.getElementById('myJobsCount').textContent = myJobsCache.length;
            displayJobsOverview(availableJobsCache, myJobsCache);
        }
    } catch (error) {
        console.error('Error loading my jobs:', error);
    }
}

// Display available jobs
function displayAvailableJobs(jobs) {
    const container = document.getElementById('availableJobsContainer');
    
    if (!jobs || jobs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3>No available service jobs</h3>
                <p>New confirmed service orders will appear here</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = jobs.map(job => `
        <div class="job-card">
            <div class="job-card-left">
                <div class="job-card-icon">🔧</div>
                <div class="job-card-info">
                    <h3>${job.customerName || 'Customer'}</h3>
                    <p>${job.serviceType || 'Service'}</p>
                    <div class="job-card-meta">
                        <span>📅 ${new Date(job.requestDate).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
            <div class="job-card-right">
                <span class="job-badge badge-available">Available</span>
                <button class="btn-action" onclick="acceptJob('${job._id}')">Accept</button>
            </div>
        </div>
    `).join('');
}

function displayJobsOverview(availableJobs = [], myJobs = []) {
    const claimList = document.getElementById('claimList');
    const progressList = document.getElementById('progressList');
    const wrapList = document.getElementById('wrapList');

    const scheduledJobs = (myJobs || []).filter(job => (job.status || '').toLowerCase() === 'scheduled');
    const inProgressJobs = (myJobs || []).filter(job => (job.status || '').toLowerCase() === 'in-progress' || (job.status || '').toLowerCase() === 'in progress');
    const completedJobs = (myJobs || []).filter(job => ['completed', 'complete', 'done', 'paid'].includes((job.status || '').toLowerCase()));

    const claimItems = [
        ...(availableJobs || []).slice(0, 2),
        ...scheduledJobs.slice(0, 1)
    ].slice(0, 3);

    renderOverviewList(claimList, claimItems, 'No open jobs right now.');
    renderOverviewList(progressList, inProgressJobs.slice(0, 3), 'No jobs are in progress.');
    renderOverviewList(wrapList, completedJobs.slice(0, 3), 'Nothing needs wrapping up yet.');

    const scheduledCount = scheduledJobs.length;
    document.getElementById('jobCount').textContent = `${(availableJobs || []).length} available services - ${scheduledCount} scheduled`;
}

function renderOverviewList(container, items, emptyText) {
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = `<div class="overview-empty">${emptyText}</div>`;
        return;
    }

    container.innerHTML = items.map((item) => `
        <div class="overview-item">
            <strong>${item.customerName || 'Customer'}</strong>
            <span>${item.serviceType || item.serviceDescription || item.jobType || 'Service task'}</span>
        </div>
    `).join('');
}

// Display my jobs
function displayMyJobs(jobs) {
    const container = document.getElementById('myJobsContainer');
    
    if (!jobs || jobs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📌</div>
                <h3>No assigned jobs yet</h3>
                <p>Accept available jobs to see them here</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = jobs.map(job => {
        const statusClass = `badge-${job.status}`;
        const statusText = job.status.charAt(0).toUpperCase() + job.status.slice(1);
        
        return `
            <div class="job-card">
                <div class="job-card-left">
                    <div class="job-card-icon">🔨</div>
                    <div class="job-card-info">
                        <h3>${job.customerName || 'Customer'}</h3>
                        <p>${job.serviceType || 'Service'}</p>
                        <div class="job-card-meta">
                            <span>📅 ${new Date(job.scheduledDate || job.createdDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div class="job-card-right">
                    <span class="job-badge ${statusClass}">${statusText}</span>
                    ${job.status === 'scheduled' ? `<button class="btn-action" onclick="startJob('${job._id}')">Start</button>` : ''}
                    ${job.status === 'in-progress' ? `<button class="btn-action" onclick="completeJob('${job._id}')">Complete</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Accept a job
async function acceptJob(jobId) {
    const mechanic = checkAuth();
    if (!mechanic) return;
    
    try {
        const response = await fetch(`http://localhost:5000/api/mechanic/jobs/${jobId}/accept`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('mechanicToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ mechanicId: mechanic.id || mechanic._id })
        });
        
        if (response.ok) {
            showToast('Job accepted!', 'success');
            loadAvailableJobs();
            loadMyJobs();
        } else {
            showToast('Failed to accept job', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('An error occurred', 'error');
    }
}

// Start a job
async function startJob(jobId) {
    try {
        const response = await fetch(`http://localhost:5000/api/mechanic/jobs/${jobId}/start`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('mechanicToken')}`
            }
        });
        
        if (response.ok) {
            showToast('Job started!', 'success');
            loadMyJobs();
        } else {
            showToast('Failed to start job', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('An error occurred', 'error');
    }
}

// Complete a job
async function completeJob(jobId) {
    try {
        const response = await fetch(`http://localhost:5000/api/mechanic/jobs/${jobId}/complete`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('mechanicToken')}`
            }
        });
        
        if (response.ok) {
            showToast('Job completed!', 'success');
            loadMyJobs();
        } else {
            showToast('Failed to complete job', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('An error occurred', 'error');
    }
}

// Load initial data
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadAvailableJobs();
    loadMyJobs();
});

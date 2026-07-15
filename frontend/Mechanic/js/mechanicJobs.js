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
            displayAvailableJobs(jobs);
        }
    } catch (error) {
        console.error('Error loading available jobs:', error);
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
            displayMyJobs(jobs);
            
            // Update badge count
            document.getElementById('myJobsCount').textContent = jobs.length;
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
            alert('Job accepted!');
            loadAvailableJobs();
            loadMyJobs();
        } else {
            alert('Failed to accept job');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred');
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
            alert('Job started!');
            loadMyJobs();
        } else {
            alert('Failed to start job');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred');
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
            alert('Job completed!');
            loadMyJobs();
        } else {
            alert('Failed to complete job');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred');
    }
}

// Load initial data
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadAvailableJobs();
});

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

// Load dashboard data
async function loadDashboardData() {
    const mechanic = checkAuth();
    if (!mechanic) return;
    
    // Set welcome message
    document.getElementById('welcomeMsg').textContent = `Welcome, ${mechanic.firstName}!`;
    
    // Set current date
    const today = new Date();
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    document.getElementById('currentDate').textContent = today.toLocaleDateString('en-US', options);
    
    try {
        const mechanicId = mechanic.id || mechanic._id;

        // Fetch mechanic statistics
        const response = await fetch(`http://localhost:5000/api/mechanic/${mechanicId}/stats`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('mechanicToken')}`
            }
        });
        
        if (response.ok) {
            const stats = await response.json();
            
            // Update stats
            document.getElementById('totalJobs').textContent = stats.totalJobs || 0;
            document.getElementById('scheduledJobs').textContent = stats.scheduledJobs || 0;
            document.getElementById('inProgressJobs').textContent = stats.inProgressJobs || 0;
            document.getElementById('completedJobs').textContent = stats.completedJobs || 0;
            document.getElementById('totalEarnings').textContent = `₱${(stats.totalEarnings || 0).toLocaleString()}`;
            document.getElementById('paidJobsCount').textContent = `${stats.paidJobs || 0} paid jobs`;
        }
        
        // Fetch recent jobs
        const jobsResponse = await fetch(`http://localhost:5000/api/mechanic/${mechanicId}/jobs`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('mechanicToken')}`
            }
        });
        
        if (jobsResponse.ok) {
            const jobs = await jobsResponse.json();
            displayRecentJobs(jobs.slice(0, 4));
        }
        
        // Fetch service requests
        const requestsResponse = await fetch('http://localhost:5000/api/mechanic/service-requests/pending', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('mechanicToken')}`
            }
        });
        
        if (requestsResponse.ok) {
            const requests = await requestsResponse.json();
            displayServiceRequests(requests);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Display recent jobs
function displayRecentJobs(jobs) {
    const container = document.getElementById('recentJobsContainer');
    
    if (!jobs || jobs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3>No recent jobs</h3>
                <p>Your completed jobs will appear here.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = jobs.map(job => {
        const completedDate = job.completedDate || job.updatedAt || job.createdAt;
        const displayDate = completedDate ? new Date(completedDate).toLocaleDateString() : '—';

        return `
            <div class="job-item">
                <div class="job-item-left">
                    <div class="job-item-icon">🔧</div>
                    <div class="job-item-info">
                        <h4>${job.customerName || 'Customer'}</h4>
                        <p>${job.serviceType || 'Service'}</p>
                    </div>
                </div>
                <div class="job-item-right">
                    <div class="job-status status-paid">Paid</div>
                    <div class="job-date">${displayDate}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Display service requests
function displayServiceRequests(requests) {
    const container = document.getElementById('serviceRequestsContainer');
    
    if (!requests || requests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📞</div>
                <h3>No pending service requests</h3>
                <p>When a customer confirms a service booking, it will appear here for you to accept and schedule.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = requests.map(req => `
        <div class="job-item">
            <div class="job-item-left">
                <div class="job-item-icon">📞</div>
                <div class="job-item-info">
                    <h4>${req.customerName || 'Customer'}</h4>
                    <p>${req.serviceDescription || 'Service Request'}</p>
                </div>
            </div>
            <div class="job-item-right">
                <button class="btn-accept" onclick="acceptServiceRequest('${req._id}')">Accept</button>
            </div>
        </div>
    `).join('');
}

// Accept service request
async function acceptServiceRequest(requestId) {
    const mechanic = checkAuth();
    if (!mechanic) return;
    
    try {
        const response = await fetch(`http://localhost:5000/api/mechanic/service-requests/${requestId}/accept`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('mechanicToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ mechanicId: mechanic.id || mechanic._id })
        });
        
        if (response.ok) {
            alert('Service request accepted!');
            loadDashboardData();
        } else {
            alert('Failed to accept service request');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred');
    }
}

// Load data on page load
document.addEventListener('DOMContentLoaded', loadDashboardData);

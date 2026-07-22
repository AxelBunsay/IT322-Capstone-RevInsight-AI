function checkAuth() {
    const token = localStorage.getItem('mechanicToken');
    const mechanic = localStorage.getItem('mechanic');
    
    if (!token || !mechanic) {
        window.location.href = 'mechanicLogin.html';
        return null;
    }
    
    return JSON.parse(mechanic);
}

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

async function loadProfile() {
    const mechanic = checkAuth();
    if (!mechanic) return;

    try {
        const response = await fetch(`https://it322-capstone-revinsight-ai.onrender.com/api/mechanics/profile`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('mechanicToken')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load profile');
        }

        const data = await response.json();
        const profile = data.mechanic;

        populateForm(profile);
        displayProfileHeader(profile);
        displayStatistics(profile);
    } catch (error) {
        console.error('Error loading profile:', error);
        showAlert('Failed to load profile', 'error');
    }
}

function populateForm(profile) {
    document.getElementById('firstName').value = profile.firstName || '';
    document.getElementById('lastName').value = profile.lastName || '';
    document.getElementById('email').value = profile.email || '';
    document.getElementById('phoneNumber').value = profile.phoneNumber || '';
    document.getElementById('specialization').value = profile.specialization || '';
    document.getElementById('yearsOfExperience').value = profile.yearsOfExperience || 0;
    document.getElementById('certifications').value = (profile.certifications || []).join(', ');
    document.getElementById('bio').value = profile.bio || '';
    document.getElementById('availabilityStatus').value = profile.availabilityStatus || 'available';
}

function displayProfileHeader(profile) {
    const headerHTML = `
        <div class="profile-avatar">
            ${profile.photoUrl ? `<img src="${profile.photoUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : '👤'}
        </div>
        <div class="profile-info">
            <div class="profile-name">${profile.firstName} ${profile.lastName}</div>
            <div class="profile-specialty">${profile.specialization} Specialist</div>
            <div class="profile-meta">
                <div class="profile-meta-item">
                    <span class="profile-meta-label">Experience</span>
                    <span class="profile-meta-value">${profile.yearsOfExperience} years</span>
                </div>
                <div class="profile-meta-item">
                    <span class="profile-meta-label">Status</span>
                    <span class="status-badge status-${profile.availabilityStatus}">${profile.availabilityStatus}</span>
                </div>
            </div>
        </div>
    `;
    document.getElementById('profileHeader').innerHTML = headerHTML;
}

function displayStatistics(profile) {
    document.getElementById('totalRepairs').textContent = profile.totalRepairs || 0;
    document.getElementById('successRateDisplay').textContent = `${Math.round(profile.successRate || 0)}%`;
    document.getElementById('averageRatingDisplay').textContent = (profile.averageRating || 0).toFixed(1);
    document.getElementById('accountStatus').textContent = profile.isActive ? 'Active' : 'Inactive';
}

function showAlert(message, type) {
    const alertContainer = document.getElementById('alertContainer');
    const alertClass = type === 'error' ? 'error' : 'success';
    const alertHTML = `<div class="${alertClass}">${message}</div>`;
    alertContainer.innerHTML = alertHTML;
    
    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, 5000);
}

async function saveProfile() {
    const mechanic = checkAuth();
    if (!mechanic) return;

    const formData = {
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        phoneNumber: document.getElementById('phoneNumber').value.trim(),
        specialization: document.getElementById('specialization').value,
        yearsOfExperience: parseInt(document.getElementById('yearsOfExperience').value),
        certifications: document.getElementById('certifications').value
            .split(',')
            .map(c => c.trim())
            .filter(c => c),
        bio: document.getElementById('bio').value.trim(),
        availabilityStatus: document.getElementById('availabilityStatus').value
    };

    if (!formData.firstName || !formData.lastName || !formData.phoneNumber) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }

    try {
        const response = await fetch(`https://it322-capstone-revinsight-ai.onrender.com/api/mechanics/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('mechanicToken')}`
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update profile');
        }

        const data = await response.json();
        
        localStorage.setItem('mechanic', JSON.stringify(data.mechanic));
        
        showAlert('Profile updated successfully!', 'success');
        loadProfile();
    } catch (error) {
        console.error('Error saving profile:', error);
        showAlert(error.message || 'Failed to save profile', 'error');
    }
}

function resetForm() {
    loadProfile();
}

document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    document.getElementById('currentDate').textContent = today.toLocaleDateString('en-US', options);
    
    loadProfile();
});

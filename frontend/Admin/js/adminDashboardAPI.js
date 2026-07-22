// API Integration Service for Admin Dashboard
// This file provides helper functions to connect the frontend dashboard to the backend API

class AdminDashboardAPI {
    constructor(baseURL = 'https://it322-capstone-revinsight-ai.onrender.com/api') {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('adminToken');
    }

    // Set authorization header
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };
    }

    // Dashboard Statistics
    async getDashboardStats() {
        try {
            const response = await fetch(`${this.baseURL}/dashboard/dashboard`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            throw error;
        }
    }

    async getRevenueData() {
        try {
            const response = await fetch(`${this.baseURL}/dashboard/dashboard/revenue`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching revenue data:', error);
            throw error;
        }
    }

    async getQuarterlyData() {
        try {
            const response = await fetch(`${this.baseURL}/dashboard/dashboard/quarterly`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching quarterly data:', error);
            throw error;
        }
    }

    async getDailyData() {
        try {
            const response = await fetch(`${this.baseURL}/dashboard/dashboard/daily`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching daily data:', error);
            throw error;
        }
    }

    // Analytics
    async getRevenueRisk() {
        try {
            const response = await fetch(`${this.baseURL}/dashboard/analytics/revenue-risk`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching revenue risk:', error);
            throw error;
        }
    }

    async getProjectedRevenue() {
        try {
            const response = await fetch(`${this.baseURL}/dashboard/analytics/projected-revenue`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching projected revenue:', error);
            throw error;
        }
    }

    // Transactions
    async getAllTransactions(page = 1, limit = 10, status = null) {
        try {
            let url = `${this.baseURL}/dashboard/transactions?page=${page}&limit=${limit}`;
            if (status) url += `&status=${status}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching transactions:', error);
            throw error;
        }
    }

    async getTransaction(id) {
        try {
            const response = await fetch(`${this.baseURL}/dashboard/transactions/${id}`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching transaction:', error);
            throw error;
        }
    }

    async createTransaction(data) {
        try {
            const response = await fetch(`${this.baseURL}/dashboard/transactions`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Error creating transaction:', error);
            throw error;
        }
    }

    async updateTransaction(id, data) {
        try {
            const response = await fetch(`${this.baseURL}/dashboard/transactions/${id}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Error updating transaction:', error);
            throw error;
        }
    }

    async deleteTransaction(id) {
        try {
            const response = await fetch(`${this.baseURL}/dashboard/transactions/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error deleting transaction:', error);
            throw error;
        }
    }

    // Inventory
    async getAllInventory(page = 1, limit = 15) {
        try {
            const response = await fetch(`${this.baseURL}/dashboard/inventory?page=${page}&limit=${limit}`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching inventory:', error);
            throw error;
        }
    }

    async getInventoryItem(id) {
        try {
            const response = await fetch(`${this.baseURL}/dashboard/inventory/${id}`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching inventory item:', error);
            throw error;
        }
    }

    async addInventoryItem(data) {
        try {
            const response = await fetch(`${this.baseURL}/dashboard/inventory`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Error adding inventory item:', error);
            throw error;
        }
    }

    async updateInventoryItem(id, data) {
        try {
            const response = await fetch(`${this.baseURL}/dashboard/inventory/${id}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Error updating inventory item:', error);
            throw error;
        }
    }

    async deleteInventoryItem(id) {
        try {
            const response = await fetch(`${this.baseURL}/dashboard/inventory/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error deleting inventory item:', error);
            throw error;
        }
    }

    // Reports
    async getSalesReport(startDate = null, endDate = null) {
        try {
            let url = `${this.baseURL}/dashboard/reports/sales`;
            if (startDate || endDate) {
                url += '?';
                if (startDate) url += `startDate=${startDate}&`;
                if (endDate) url += `endDate=${endDate}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching sales report:', error);
            throw error;
        }
    }

    async getInventoryReport() {
        try {
            const response = await fetch(`${this.baseURL}/dashboard/reports/inventory`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching inventory report:', error);
            throw error;
        }
    }

    async getMechanicsReport() {
        try {
            const response = await fetch(`${this.baseURL}/dashboard/reports/mechanics`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching mechanics report:', error);
            throw error;
        }
    }
}

// Usage Example in HTML
/*
<!-- Add this script tag to your HTML after loading adminDashboard.js -->
<script src="js/adminDashboardAPI.js"></script>

<!-- Then in your JavaScript code: -->
<script>
    const api = new AdminDashboardAPI();
    
    // Get dashboard stats
    api.getDashboardStats().then(data => {
        console.log('Dashboard stats:', data);
        // Update UI with data
    }).catch(error => {
        console.error('Failed to load dashboard stats:', error);
    });
    
    // Get all transactions
    api.getAllTransactions(1, 10).then(data => {
        console.log('Transactions:', data);
        // Populate transactions table
    });
    
    // Get inventory
    api.getAllInventory(1, 15).then(data => {
        console.log('Inventory:', data);
        // Populate inventory table
    });
</script>
*/

// Export for use in other files (if using ES6 modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminDashboardAPI;
}

import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import AdminLayout from '../../components/AdminLayout';
import { api } from '../../services/api';

const quarterlySalesData = {
  labels: ['Q1', 'Q2', 'Q3', 'Q4'],
  datasets: [{
    label: 'Revenue',
    data: [1200, 1800, 1500, 2500],
    borderColor: '#ff6b35',
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    borderWidth: 3,
    tension: 0.3,
    fill: true
  }]
};

const dailySalesData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Brake Parts',
      data: [450, 620, 380, 700, 560, 820, 640],
      backgroundColor: '#ff6b35'
    },
    {
      label: 'Accessories',
      data: [300, 480, 520, 360, 640, 500, 720],
      backgroundColor: '#4a90e2'
    },
    {
      label: 'Engine Parts',
      data: [520, 360, 610, 430, 700, 580, 460],
      backgroundColor: '#52c77a'
    },
    {
      label: 'Other',
      data: [180, 240, 220, 300, 260, 340, 280],
      backgroundColor: '#9b6dd0'
    }
  ]
};

function SalesChart({ type, data, options }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const chart = new Chart(canvasRef.current, { type, data, options });

    return () => chart.destroy();
  }, [type, data, options]);

  return <canvas ref={canvasRef} role="img" aria-label={`${data.datasets[0].label} chart`} />;
}

function AdminDashboard() {
  const [stats, setStats] = useState({ totalRevenue: 0, totalTransactions: 0, totalInventoryItems: 0 });
  const [quarterlyData, setQuarterlyData] = useState({
    labels: [],
    datasets: [{ label: 'Revenue', data: [], borderColor: '#ff6b35', backgroundColor: 'rgba(255, 107, 53, 0.15)', borderWidth: 3, tension: 0.3, fill: true }]
  });
  const [dailyData, setDailyData] = useState({
    labels: [],
    datasets: [{ label: 'Revenue', data: [], backgroundColor: '#ff6b35' }]
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    Promise.all([api.getDashboardStats(), api.getQuarterlySales(), api.getDailySales()])
      .then(([statsResponse, quarterlyResponse, dailyResponse]) => {
        if (!isMounted) return;

        const statsResult = statsResponse.data || {};
        const quarterlyResult = quarterlyResponse.data || [];
        const dailyResult = dailyResponse.data || [];

        setStats({
          totalRevenue: statsResult.totalRevenue || 0,
          totalTransactions: statsResult.totalTransactions || 0,
          totalInventoryItems: statsResult.totalInventoryItems || 0
        });

        if (quarterlyResult.length) {
          setQuarterlyData({
            labels: quarterlyResult.map((item) => `Q${item._id.quarter} ${item._id.year}`),
            datasets: [{
              ...quarterlySalesData.datasets[0],
              data: quarterlyResult.map((item) => item.revenue || 0)
            }]
          });
        }

        if (dailyResult.length) {
          setDailyData({
            labels: dailyResult.map((item) => item._id),
            datasets: [{
              label: 'Revenue',
              data: dailyResult.map((item) => item.revenue || 0),
              backgroundColor: '#ff6b35'
            }]
          });
        }
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError.message || 'Dashboard data could not be loaded.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AdminLayout title="DASHBOARD" activePath="/admin">
        <section className="section-content active">
          <div className="dashboard-grid">
            {error && <p className="dashboard-error" role="alert">{error}</p>}
            <div className="stats-container">
              <div className="stat-card">
                <div className="stat-header">
                  <h3>TOTAL REVENUE</h3>
                  <div className="stat-indicator orange"></div>
                </div>
                <div className="stat-value">₱{Number(stats.totalRevenue).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
                <div className="stat-subtitle">From confirmed orders</div>
              </div>
              <div className="stat-card">
                <div className="stat-header">
                  <h3>TOTAL TRANSACTIONS</h3>
                  <div className="stat-indicator blue"></div>
                </div>
                <div className="stat-value">{stats.totalTransactions}</div>
                <div className="stat-subtitle">All time</div>
              </div>
              <div className="stat-card">
                <div className="stat-header">
                  <h3>INVENTORY ITEMS</h3>
                  <div className="stat-indicator green"></div>
                </div>
                <div className="stat-value">{stats.totalInventoryItems}</div>
                <div className="stat-subtitle">Active items</div>
              </div>
            </div>

            <div className="charts-container">
              <div className="chart-card">
                <h3>QUARTERLY SALES</h3>
                <p className="chart-subtitle">Revenue per quarter</p>
                <div className="date-range">2025-2026</div>
                <div className="chart-canvas">
                  <SalesChart
                    type="line"
                    data={quarterlyData}
                    options={{ responsive: true, maintainAspectRatio: false }}
                  />
                </div>
              </div>
              <div className="chart-card">
                <h3>DAILY SALES</h3>
                <p className="chart-subtitle">Sales breakdown by category this week</p>
                <div className="chart-canvas">
                  <SalesChart
                    type="bar"
                    data={dailyData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: { y: { beginAtZero: true } }
                    }}
                  />
                </div>
                <div className="chart-legend">
                  <span><span className="legend-dot orange"></span> Revenue</span>
                </div>
              </div>
            </div>
          </div>
        </section>
    </AdminLayout>
  );
}

export default AdminDashboard;
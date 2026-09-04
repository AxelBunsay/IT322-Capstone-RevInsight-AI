import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import '../../Admin/css/adminDashboard.css';

function AdminLayout({ title, activePath, children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="admin-container">
      <Sidebar
        isOpen={isSidebarOpen}
        activePath={activePath}
        onClose={() => setIsSidebarOpen(false)}
      />
      <main className="main-content">
        <Header
          title={title}
          onMenuClick={() => setIsSidebarOpen((isOpen) => !isOpen)}
        />
        {children}
      </main>
    </div>
  );
}

export default AdminLayout;

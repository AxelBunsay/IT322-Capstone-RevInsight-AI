const navigation = [
  { id: 'dashboard', label: 'Dashboard', path: '/admin', icon: 'dashboard', roles: ['admin'] },
  { id: 'revenue', label: 'Revenue', path: '/admin/revenue', icon: 'revenue', roles: ['admin'] },
  { id: 'transactions', label: 'Transactions', path: '/admin/transactions', icon: 'transactions', roles: ['admin'], badgeKey: 'pendingTransactions' },
  { id: 'inventory', label: 'Inventory', path: '/admin/inventory', icon: 'inventory', roles: ['admin'], badgeKey: 'lowStock' },
  { id: 'mechanics', label: 'Mechanics', path: '/admin/mechanics', icon: 'mechanics', roles: ['admin'] }
];

export default navigation;

import Panel from '../common/Panel';
import EmptyState from '../common/EmptyState';

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });

function CategoryRevenue({ categories = [] }) {
  const total = categories.reduce((sum, category) => sum + Number(category.revenue || 0), 0);
  const rows = categories.map((category) => ({
    ...category,
    share: total ? (Number(category.revenue || 0) / total) * 100 : 0
  }));
  const maximumShare = Math.max(...rows.map((row) => row.share), 0);

  return (
    <Panel title="Revenue by category" className="admin-category-panel">
      {!rows.length ? <EmptyState>No sales yet. Confirmed orders will appear here.</EmptyState> : (
        <div className="admin-category-list">
          {rows.map((category) => (
            <div className="admin-category-row" key={category.name}>
              <div className="admin-category-row__top"><strong>{category.name}</strong><span>{peso.format(category.revenue)} <small>{Math.round(category.share)}%</small></span></div>
              <div className="admin-category-track" role="progressbar" aria-label={`${category.name} share of revenue`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(category.share)}>
                <span style={{ width: `${maximumShare ? (category.share / maximumShare) * 100 : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

export default CategoryRevenue;

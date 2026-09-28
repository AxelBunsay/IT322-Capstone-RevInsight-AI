function SalesSummary({ period, series }) {
  const labels = {
    daily: ['Sales this week', 'vs yesterday'],
    weekly: ['Sales, last 8 weeks', 'vs last week'],
    monthly: ['Sales, last 12 months', 'vs last month']
  };
  const values = series.map((item) => Number(item.value || 0));
  const total = values.reduce((sum, value) => sum + value, 0);
  const latest = values.at(-1) || 0;
  const previous = values.at(-2) || 0;
  const delta = previous ? ((latest - previous) / previous) * 100 : 0;
  const deltaText = `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`;
  const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });

  return (
    <div className="admin-sales-summary">
      <div className="admin-sales-summary__total">
        <span>{labels[period][0]}</span>
        <strong>{peso.format(total)}</strong>
        <small>Latest {peso.format(latest)} · {deltaText} {labels[period][1]}</small>
      </div>
    </div>
  );
}

export default SalesSummary;

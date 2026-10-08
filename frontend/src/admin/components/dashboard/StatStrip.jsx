import StatCell from './StatCell';

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });

function StatStrip({ stats }) {
  return (
    <section className="admin-stat-strip" aria-label="Business overview">
      <StatCell label="Total sales" value={stats.itemsSold?.value} change={stats.itemsSold?.change} detail="items sold vs last month" sparkline={stats.itemsSold?.sparkline} />
      <StatCell label="Total transactions" value={stats.totalTransactions?.value} change={stats.totalTransactions?.change} detail="vs last month" sparkline={stats.totalTransactions?.sparkline} />
      <StatCell label="Inventory items" value={stats.inventoryItems?.value} detail="active items" sparkline={stats.inventoryItems?.sparkline} />
      <StatCell label="Revenue" value={stats.revenue?.value} change={stats.revenue?.change} detail="from confirmed orders" formatValue={(value) => peso.format(value)} sparkline={stats.revenue?.sparkline} />
    </section>
  );
}

export default StatStrip;

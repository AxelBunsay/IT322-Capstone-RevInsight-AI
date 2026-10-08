function Sparkline({ values = [] }) {
  if (values.length < 2) return <span className="admin-sparkline admin-sparkline--empty" aria-hidden="true" />;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const spread = max - min || 1;
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${29 - ((value - min) / spread) * 24}`).join(' ');

  return (
    <svg className="admin-sparkline" viewBox="0 0 100 34" preserveAspectRatio="none" role="img" aria-label="Recent trend">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default Sparkline;

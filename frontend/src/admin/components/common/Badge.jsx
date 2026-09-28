function Badge({ children, tone = 'neutral' }) {
  return <span className={`admin-badge admin-badge--${tone}`}>{children}</span>;
}

export default Badge;

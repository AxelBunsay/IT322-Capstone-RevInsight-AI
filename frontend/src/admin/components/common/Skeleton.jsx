function Skeleton({ className = '', label = 'Loading' }) {
  return <div className={`admin-skeleton ${className}`.trim()} role="status" aria-label={label} />;
}

export default Skeleton;

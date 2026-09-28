function Panel({ title, children, className = '', action }) {
  return (
    <section className={`admin-panel ${className}`.trim()}>
      {(title || action) && (
        <header className="admin-panel__header">
          {title && <h2>{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export default Panel;

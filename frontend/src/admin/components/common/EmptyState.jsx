function EmptyState({ children, action }) {
  return (
    <div className="admin-empty-state">
      <p>{children}</p>
      {action}
    </div>
  );
}

export default EmptyState;

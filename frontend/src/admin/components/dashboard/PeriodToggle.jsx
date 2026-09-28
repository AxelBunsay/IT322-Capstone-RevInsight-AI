const periods = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' }
];

function PeriodToggle({ value, onChange }) {
  return (
    <div className="admin-period-toggle" role="group" aria-label="Sales chart period">
      {periods.map((period) => (
        <button key={period.id} type="button" aria-pressed={value === period.id} className={value === period.id ? 'is-active' : ''} onClick={() => onChange(period.id)}>
          {period.label}
        </button>
      ))}
    </div>
  );
}

export default PeriodToggle;

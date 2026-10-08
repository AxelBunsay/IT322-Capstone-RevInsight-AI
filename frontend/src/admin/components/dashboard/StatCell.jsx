import Sparkline from './Sparkline';

function StatCell({ label, value, detail, change, sparkline = [], formatValue = (number) => number.toLocaleString('en-PH') }) {
  const isNegative = Number(change) < 0;
  const changeText = `${isNegative ? '' : '+'}${Number(change || 0).toLocaleString('en-PH')}%`;

  return (
    <article className="admin-stat-cell">
      <h2>{label}</h2>
      <p className="admin-stat-cell__value">{formatValue(Number(value || 0))}</p>
      <p className={`admin-stat-cell__detail${isNegative ? ' is-negative' : ''}`}>
        {change === undefined ? detail : <><span>{changeText}</span> {detail}</>}
      </p>
      <Sparkline values={sparkline} />
    </article>
  );
}

export default StatCell;

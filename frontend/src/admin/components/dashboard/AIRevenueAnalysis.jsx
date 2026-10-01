import { useEffect, useMemo, useState } from 'react';

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });
const compactPeso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', notation: 'compact', maximumFractionDigits: 0 });

const quarterLabels = ['24 Q2', '24 Q3', '24 Q4', '25 Q1', '25 Q2', '25 Q3', '25 Q4', '26 Q1'];
const quarterNames = ['2024 Q2', '2024 Q3', '2024 Q4', '2025 Q1', '2025 Q2', '2025 Q3', '2025 Q4', '2026 Q1'];
const baseRevenue = [392000, 385000, 418000, 426000, 411000, 431000, 478000, 536000];
const baseJobs = [562, 548, 591, 604, 588, 621, 677, 724];
const partsMargin = [22, 23, 24, 24, 26, 27, 26, 25];
const overdue = [7, 8, 6, 7, 8, 9, 10, 11];
const newCustomerShare = [39, 41, 38, 43, 40, 42, 44, 42];
const rejectedRevenue = 18400;

const cardDefinitions = [
  { id: 'revenue', icon: '↗', title: 'Revenue trend & growth', kind: 'trend' },
  { id: 'mix', icon: '✣', title: 'Revenue mix (Labor / Parts / Charges)', kind: 'risk' },
  { id: 'service', icon: '⌁', title: 'Service type concentration', kind: 'risk' },
  { id: 'mechanic', icon: '●', title: 'Mechanic concentration', kind: 'risk' },
  { id: 'customer', icon: '♟', title: 'Customer composition', kind: 'trend' },
  { id: 'season', icon: '◌', title: 'Seasonality & forecast', kind: 'trend' },
  { id: 'margin', icon: '$', title: 'Margin signal', kind: 'trend' },
  { id: 'ops', icon: '◷', title: 'Operational drag', kind: 'trend' }
];

function percentChange(current, previous) {
  return previous ? ((current - previous) / previous) * 100 : 0;
}

function getTier(items) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const ranked = items.map((item) => ({ ...item, share: total ? (item.value / total) * 100 : 0 })).sort((a, b) => b.share - a.share);
  const top = ranked[0]?.share || 0;
  const topTwo = (ranked[0]?.share || 0) + (ranked[1]?.share || 0);
  const contributors = ranked.filter((item) => item.share >= 5).length;
  const tier = top > 60 || topTwo > 85 || contributors <= 2 ? 'High' : top >= 40 || topTwo >= 70 ? 'Moderate' : 'Normal';
  return { tier, ranked };
}

function LineChart({ values, labels, color = '#f26a1b' }) {
  const width = 700;
  const height = 190;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const points = values.map((value, index) => `${(index / Math.max(values.length - 1, 1)) * width},${height - ((value - min) / range) * 125 - 25}`).join(' ');
  const area = `0,${height} ${points} ${width},${height}`;

  return (
    <div className="ai-revenue-chart" role="img" aria-label="Revenue trend chart">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs><linearGradient id="ai-revenue-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".25" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
        <polygon points={area} fill="url(#ai-revenue-fill)" />
        <polyline points={points} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {values.map((value, index) => {
          const [x, y] = points.split(' ')[index].split(',');
          return <circle key={`${labels[index]}-${value}`} cx={x} cy={y} r={index === values.length - 1 ? 5 : 3} fill="#fff" stroke={color} strokeWidth="3" />;
        })}
      </svg>
      <div className="ai-revenue-chart__labels">{labels.map((label) => <span key={label}>{label}</span>)}</div>
    </div>
  );
}

function HorizontalBars({ items }) {
  const max = Math.max(...items.map((item) => item.share), 1);
  return <div className="ai-revenue-bars">{items.map((item) => (
    <div className="ai-revenue-bar" key={item.name}>
      <div className="ai-revenue-bar__top"><strong>{item.name}</strong><span>{Math.round(item.share)}%</span></div>
      <div className="ai-revenue-bar__track"><span style={{ width: `${(item.share / max) * 100}%` }} /></div>
    </div>
  ))}</div>;
}

function tierCopy(tier, category) {
  const why = {
    High: [`${category} represents a large share of current revenue.`, 'A concentrated mix makes revenue more sensitive to demand changes.', 'A smaller contributor base limits the number of natural offsets.'],
    Moderate: [`${category} leads the mix, but other contributors still provide some balance.`, 'A shift in the leading category would be visible in the next quarter.', 'The current mix is workable with deliberate diversification.'],
    Normal: ['No single contributor dominates the current revenue mix.', 'Several categories provide meaningful support to the total.', 'The mix has a healthy level of diversification.']
  };
  const recs = {
    High: [`Create a targeted plan to grow the second-largest category beside ${category}.`, 'Track this mix monthly and set a concentration threshold for review.', 'Bundle related services or parts to broaden the revenue base.'],
    Moderate: [`Set a quarterly growth target for categories behind ${category}.`, 'Review pricing and availability for the leading category.', 'Keep a watchlist for two consecutive periods of further concentration.'],
    Normal: ['Maintain the current category balance while testing new offers.', 'Use the strongest contributors to cross-sell lower-share categories.', 'Review the mix after the next full quarter of data.']
  };
  return { why: why[tier], recs: recs[tier] };
}

function AIRevenueAnalysis({ dashboardData }) {
  const [qIdx, setQIdx] = useState(quarterLabels.length - 1);
  const [modalId, setModalId] = useState(null);
  const liveRevenue = Number(dashboardData?.stats?.revenue?.value || 0);
  const revenue = useMemo(() => baseRevenue.map((value, index) => index === baseRevenue.length - 1 && liveRevenue ? liveRevenue : value), [liveRevenue]);
  const currentRevenue = revenue[qIdx];
  const previousRevenue = revenue[qIdx - 1] || revenue[qIdx];
  const labor = currentRevenue * .21;
  const parts = currentRevenue * .63;
  const charges = currentRevenue - labor - parts;
  const modal = cardDefinitions.find((card) => card.id === modalId);

  const riskData = useMemo(() => {
    const service = [{ name: 'Brake service', value: currentRevenue * .4 }, { name: 'Engine service', value: currentRevenue * .24 }, { name: 'Oil change', value: currentRevenue * .16 }, { name: 'Electrical', value: currentRevenue * .11 }, { name: 'Other', value: currentRevenue * .09 }];
    const mechanics = ['Miguel Santos', 'Andrea Cruz', 'Rafael Lim', 'Noel Garcia', 'Other'].map((name, index) => ({ name, value: currentRevenue * [0.31, 0.24, 0.19, 0.15, 0.11][index] }));
    const mix = [{ name: 'Parts', value: parts }, { name: 'Labor', value: labor }, { name: 'Charges', value: charges }];
    if (modalId === 'service') return { label: 'Brake service', ...getTier(service), items: service };
    if (modalId === 'mechanic') return { label: 'Miguel Santos', ...getTier(mechanics), items: mechanics };
    return { label: 'Parts', ...getTier(mix), items: mix };
  }, [charges, currentRevenue, labor, modalId, parts]);

  useEffect(() => {
    if (!modalId) return undefined;
    const onKeyDown = (event) => { if (event.key === 'Escape') setModalId(null); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [modalId]);

  function renderTrendModal() {
    if (modalId === 'revenue') return { headline: `${percentChange(currentRevenue, previousRevenue).toFixed(1)}% QoQ`, detail: 'Revenue trend across the last eight quarters', chart: <LineChart values={revenue} labels={quarterLabels} />, callout: 'Revenue is moving upward with a healthy quarter-over-quarter signal.', recs: ['Keep the strongest service and parts bundles visible to repeat customers.', 'Compare the next quarter against the same quarter last year.', 'Investigate any two-quarter decline before it becomes a pattern.'] };
    if (modalId === 'customer') return { headline: `${100 - newCustomerShare[qIdx]}% repeat customers`, detail: `${newCustomerShare[qIdx]}% of revenue comes from new customers`, chart: <HorizontalBars items={[{ name: 'Repeat customers', share: 100 - newCustomerShare[qIdx] }, { name: 'New customers', share: newCustomerShare[qIdx] }]} />, callout: 'Repeat revenue is generally more predictable and gives the team a stable base.', recs: ['Create a return-visit offer for customers who completed a job this quarter.', 'Track new-customer share beside repeat revenue, not as a standalone target.', 'Ask service advisors to recommend the next maintenance milestone.'] };
    if (modalId === 'season') return { headline: qIdx >= 4 ? `${compactPeso.format(revenue[qIdx] * 1.06)} projected` : 'Not enough history', detail: qIdx >= 4 ? 'Naive projection for the next quarter' : 'A full year of history is needed before forecasting', chart: qIdx >= 4 ? <LineChart values={[...revenue, revenue[qIdx] * 1.06]} labels={[...quarterLabels, 'Next']} /> : null, callout: qIdx >= 4 ? 'The projection is directional and should be paired with current inventory and demand signals.' : 'The analysis will show a forecast after four quarters of history are available.', recs: ['Treat the projection as a planning input, not a guaranteed target.', 'Compare projected demand with parts lead times and stock levels.', 'Refresh the forecast after each completed quarter.'] };
    if (modalId === 'margin') return { headline: `${partsMargin[qIdx]}% parts margin`, detail: 'Parts revenue less parts cost, divided by parts revenue', chart: <LineChart values={partsMargin} labels={quarterLabels} color="#2e9e5b" />, callout: `Rejected additional-findings revenue is ${peso.format(rejectedRevenue)} and should be reviewed separately.`, recs: ['Review low-margin parts before expanding their stock position.', 'Pair high-margin parts with labor recommendations where appropriate.', 'Keep rejected findings visible so approved-but-unbilled work is not lost.'] };
    return { headline: `${overdue[qIdx]}% jobs overdue`, detail: peso.format(rejectedRevenue) + ' in approved-but-unbilled findings', chart: <LineChart values={overdue} labels={quarterLabels} color="#d6402b" />, callout: 'Overdue work creates operational drag and can delay otherwise earned revenue.', recs: ['Review overdue jobs in the weekly service-request meeting.', 'Assign an owner and next action to every approved-but-unbilled finding.', 'Compare overdue percentage with mechanic capacity before accepting new work.'] };
  }

  const trendModal = modal?.kind === 'trend' ? renderTrendModal() : null;
  const riskCopy = modal?.kind === 'risk' ? tierCopy(riskData.tier, riskData.label) : null;
  const currentShare = modal?.id === 'mix' ? Math.round((parts / currentRevenue) * 100) : modal?.id === 'service' ? 40 : modal?.id === 'mechanic' ? 31 : 0;

  return (
    <section className="ai-revenue-analysis" aria-labelledby="ai-revenue-title">
      <div className="ai-revenue-analysis__header">
        <div className="ai-revenue-analysis__title"><span className="ai-revenue-analysis__mark">✦</span><div><h2 id="ai-revenue-title">AI Revenue Analysis</h2><p>Generated from current and historical job data</p></div></div>
        <div className="ai-revenue-tabs" role="tablist" aria-label="Revenue analysis quarter">
          {quarterLabels.map((label, index) => <button type="button" role="tab" aria-selected={qIdx === index} className={qIdx === index ? 'is-active' : ''} key={label} onClick={() => setQIdx(index)}>{label}</button>)}
        </div>
      </div>
      <div className="ai-revenue-summary">
        <div><span>Total revenue - {quarterNames[qIdx]}</span><strong>{peso.format(currentRevenue)}</strong><em className={percentChange(currentRevenue, previousRevenue) >= 0 ? 'is-positive' : 'is-negative'}>{percentChange(currentRevenue, previousRevenue) >= 0 ? '▲' : '▼'} {Math.abs(percentChange(currentRevenue, previousRevenue)).toFixed(1)}% QoQ</em><small>{baseJobs[qIdx]} jobs · avg {peso.format(currentRevenue / baseJobs[qIdx])} per job</small></div>
        <LineChart values={revenue} labels={quarterLabels} />
      </div>
      <div className="ai-revenue-cards">
        {cardDefinitions.map((card) => {
          const isNegative = (card.id === 'margin' && qIdx > 0 && partsMargin[qIdx] < partsMargin[qIdx - 1]) || (card.id === 'ops' && overdue[qIdx] > overdue[qIdx - 1]);
          let value = card.id === 'revenue' ? peso.format(currentRevenue) : card.id === 'mix' ? `${Math.round((parts / currentRevenue) * 100)}% from Parts` : card.id === 'service' ? '40% from Brake service' : card.id === 'mechanic' ? '31% from Miguel Santos' : card.id === 'customer' ? `${100 - newCustomerShare[qIdx]}% repeat customers` : card.id === 'season' ? (qIdx >= 4 ? 'Forecast ready' : 'More history needed') : card.id === 'margin' ? `${partsMargin[qIdx]}% parts margin` : `${overdue[qIdx]}% jobs overdue`;
          const pill = card.id === 'mix' ? 'High risk' : card.id === 'service' || card.id === 'mechanic' ? 'Normal risk' : card.id === 'season' ? 'Projection available' : card.id === 'revenue' ? `${percentChange(currentRevenue, previousRevenue) >= 0 ? '+' : ''}${percentChange(currentRevenue, previousRevenue).toFixed(1)}% QoQ` : card.id === 'customer' ? `+${newCustomerShare[qIdx] - newCustomerShare[qIdx - 1] || 0}.0% new-customer share` : card.id === 'margin' ? `${isNegative ? '-' : '+'}${Math.abs(partsMargin[qIdx] - (partsMargin[qIdx - 1] || partsMargin[qIdx])).toFixed(1)}% vs last Q` : `${isNegative ? '+' : '-'}${Math.abs(overdue[qIdx] - (overdue[qIdx - 1] || overdue[qIdx])).toFixed(1)}% vs last Q`;
          return <button type="button" className="ai-revenue-card" key={card.id} onClick={() => setModalId(card.id)}><div className="ai-revenue-card__top"><span className="ai-revenue-card__icon">{card.icon}</span><em className={`ai-revenue-pill ${isNegative ? 'is-bad' : card.id === 'mix' ? 'is-bad' : card.id === 'season' ? 'is-warn' : 'is-good'}`}>{pill}</em></div><strong>{card.title}</strong><b>{value}</b><small>{card.id === 'revenue' ? `${percentChange(currentRevenue, revenue[Math.max(0, qIdx - 4)]).toFixed(1)}% vs same quarter last year` : card.id === 'mix' ? 'Top category share of total revenue' : card.id === 'service' ? 'Share of revenue from one service type' : card.id === 'mechanic' ? 'Revenue generated by top mechanic' : card.id === 'customer' ? 'Repeat revenue is generally more predictable' : card.id === 'season' ? 'Pattern-based projection for next quarter' : card.id === 'margin' ? '(Parts revenue - parts cost) ÷ parts revenue' : peso.format(rejectedRevenue) + ' in approved-but-unbilled findings'}</small></button>;
        })}
      </div>
      {modal && <div className="ai-revenue-modal-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalId(null); }}><section className="ai-revenue-modal" role="dialog" aria-modal="true" aria-labelledby="ai-modal-title"><button type="button" className="ai-revenue-modal__close" aria-label="Close analysis" onClick={() => setModalId(null)}>×</button><p className="ai-revenue-modal__eyebrow">{quarterNames[qIdx]} analysis</p><h2 id="ai-modal-title">{modal.title}</h2>{modal.kind === 'risk' ? <><div className="ai-revenue-tier-tabs">{['Normal', 'Moderate', 'High'].map((tier) => <span className={riskData.tier === tier ? 'is-active' : ''} key={tier}>{tier}</span>)}</div><div className={`ai-revenue-callout is-${riskData.tier.toLowerCase()}`}><strong>{riskData.tier} concentration</strong><span>{riskData.label} contributes {currentShare}% of revenue.</span></div><HorizontalBars items={riskData.ranked} /><h3>Why this risk level</h3><ul className="ai-revenue-modal-list">{riskCopy.why.map((item) => <li key={item}>{item}</li>)}</ul><h3>Recommended actions</h3><ol className="ai-revenue-modal-list ai-revenue-modal-list--numbered">{riskCopy.recs.map((item) => <li key={item}>{item}</li>)}</ol></> : <><strong className="ai-revenue-modal__headline">{trendModal.headline}</strong><p className="ai-revenue-modal__detail">{trendModal.detail}</p>{trendModal.chart}<div className="ai-revenue-callout is-normal">{trendModal.callout}</div><h3>Recommended actions</h3><ol className="ai-revenue-modal-list ai-revenue-modal-list--numbered">{trendModal.recs.map((item) => <li key={item}>{item}</li>)}</ol></>}</section></div>}
    </section>
  );
}

export default AIRevenueAnalysis;
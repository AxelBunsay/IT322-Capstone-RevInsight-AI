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
const defaultThresholds = { topCategory: 40, highTop: 60, topTwo: 70, highTopTwo: 85 };

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

const rawQuarterTransactions = [
  [
    { id: 'JO-1140', job: 'JO-1140', date: 'Nov 02, 2025', type: 'Service', customer: 'Liza Fernandez', items: 'Tune-up', amount: 1100, status: 'Paid', mechanic: 'Rico Tan' },
    { id: 'JO-1141', job: 'JO-1141', date: 'Nov 03, 2025', type: 'Service', customer: 'Mark Villanueva', items: 'Oil change', amount: 10280, status: 'Paid', mechanic: 'Allan Cruz' },
    { id: 'JO-1142', job: 'JO-1142', date: 'Nov 04, 2025', type: 'Service', customer: 'Aileen Reyes', items: 'Chain & sprocket', amount: 2450, status: 'Outstanding', mechanic: 'Miguel Santos' },
    { id: 'JO-1143', job: 'JO-1143', date: 'Nov 05, 2025', type: 'Service', customer: 'Paolo Garcia', items: 'Electrical', amount: 3600, status: 'Paid', mechanic: 'Jay Oliveros' },
    { id: 'JO-1144', job: 'JO-1144', date: 'Nov 06, 2025', type: 'Service', customer: 'Jessa Tolentino', items: 'Other', amount: 4790, status: 'Paid', mechanic: 'Dennis Ramos' }
  ],
  [
    { id: 'JO-1145', job: 'JO-1145', date: 'Nov 07, 2025', type: 'Service', customer: 'Ramon Dela Cruz', items: 'Brake service', amount: 5960, status: 'Paid', mechanic: 'Rico Tan' },
    { id: 'JO-1146', job: 'JO-1146', date: 'Nov 08, 2025', type: 'Service', customer: 'Nina Bautista', items: 'Tune-up', amount: 7130, status: 'Paid', mechanic: 'Allan Cruz' },
    { id: 'JO-1147', job: 'JO-1147', date: 'Nov 09, 2025', type: 'Service', customer: 'Carlo Mendoza', items: 'Oil change', amount: 8300, status: 'Paid', mechanic: 'Miguel Santos' },
    { id: 'JO-1148', job: 'JO-1148', date: 'Nov 10, 2025', type: 'Service', customer: 'Rina Santos', items: 'Electrical', amount: 6780, status: 'Outstanding', mechanic: 'Jay Oliveros' }
  ],
  [
    { id: 'JO-1149', job: 'JO-1149', date: 'Nov 11, 2025', type: 'Service', customer: 'Janet Pineda', items: 'Tune-up', amount: 8800, status: 'Paid', mechanic: 'Miguel Santos' },
    { id: 'JO-1150', job: 'JO-1150', date: 'Nov 12, 2025', type: 'Service', customer: 'Luis Ventura', items: 'Charging', amount: 5400, status: 'Paid', mechanic: 'Rico Tan' },
    { id: 'JO-1151', job: 'JO-1151', date: 'Nov 13, 2025', type: 'Service', customer: 'Mica Reyes', items: 'Brake service', amount: 10450, status: 'Outstanding', mechanic: 'Allan Cruz' },
    { id: 'JO-1152', job: 'JO-1152', date: 'Nov 15, 2025', type: 'Service', customer: 'Benedict Tan', items: 'Oil change', amount: 7600, status: 'Paid', mechanic: 'Miguel Santos' }
  ],
  [
    { id: 'JO-1153', job: 'JO-1153', date: 'Nov 18, 2025', type: 'Service', customer: 'Tessa Mendez', items: 'Tune-up', amount: 9120, status: 'Paid', mechanic: 'Rico Tan' },
    { id: 'JO-1154', job: 'JO-1154', date: 'Nov 20, 2025', type: 'Service', customer: 'Ari Robles', items: 'Chain & sprocket', amount: 12000, status: 'Paid', mechanic: 'Jay Oliveros' },
    { id: 'JO-1155', job: 'JO-1155', date: 'Nov 22, 2025', type: 'Service', customer: 'Paula Dizon', items: 'Brake service', amount: 13400, status: 'Outstanding', mechanic: 'Miguel Santos' },
    { id: 'JO-1156', job: 'JO-1156', date: 'Nov 24, 2025', type: 'Service', customer: 'Cesar Dela Rosa', items: 'Electrical', amount: 11140, status: 'Paid', mechanic: 'Allan Cruz' }
  ],
  [
    { id: 'JO-1157', job: 'JO-1157', date: 'Jan 02, 2026', type: 'Service', customer: 'Joven Santos', items: 'Tune-up', amount: 14500, status: 'Paid', mechanic: 'Miguel Santos' },
    { id: 'JO-1158', job: 'JO-1158', date: 'Jan 04, 2026', type: 'Service', customer: 'Ivy Lim', items: 'Oil change', amount: 12450, status: 'Paid', mechanic: 'Rico Tan' },
    { id: 'JO-1159', job: 'JO-1159', date: 'Jan 06, 2026', type: 'Service', customer: 'Lance Ramos', items: 'Brake service', amount: 16200, status: 'Outstanding', mechanic: 'Allan Cruz' },
    { id: 'JO-1160', job: 'JO-1160', date: 'Jan 09, 2026', type: 'Service', customer: 'Owen Vergara', items: 'Electrical', amount: 11780, status: 'Paid', mechanic: 'Jay Oliveros' }
  ],
  [
    { id: 'JO-1161', job: 'JO-1161', date: 'Apr 11, 2026', type: 'Service', customer: 'Shane Corpuz', items: 'Tune-up', amount: 15680, status: 'Paid', mechanic: 'Miguel Santos' },
    { id: 'JO-1162', job: 'JO-1162', date: 'Apr 15, 2026', type: 'Service', customer: 'Mira Bautista', items: 'Brake service', amount: 17200, status: 'Paid', mechanic: 'Rico Tan' },
    { id: 'JO-1163', job: 'JO-1163', date: 'Apr 19, 2026', type: 'Service', customer: 'Rex Tiongson', items: 'Oil change', amount: 13450, status: 'Outstanding', mechanic: 'Allan Cruz' },
    { id: 'JO-1164', job: 'JO-1164', date: 'Apr 23, 2026', type: 'Service', customer: 'Alyssa Cruz', items: 'Electrical', amount: 12780, status: 'Paid', mechanic: 'Miguel Santos' }
  ],
  [
    { id: 'JO-1165', job: 'JO-1165', date: 'Jul 05, 2026', type: 'Service', customer: 'Emman Gonzales', items: 'Tune-up', amount: 16430, status: 'Paid', mechanic: 'Rico Tan' },
    { id: 'JO-1166', job: 'JO-1166', date: 'Jul 09, 2026', type: 'Service', customer: 'Sheila Nolasco', items: 'Brake service', amount: 17890, status: 'Paid', mechanic: 'Miguel Santos' },
    { id: 'JO-1167', job: 'JO-1167', date: 'Jul 12, 2026', type: 'Service', customer: 'Romeo Delos Reyes', items: 'Oil change', amount: 14950, status: 'Outstanding', mechanic: 'Allan Cruz' },
    { id: 'JO-1168', job: 'JO-1168', date: 'Jul 17, 2026', type: 'Service', customer: 'Nina Gutierrez', items: 'Electrical', amount: 13240, status: 'Paid', mechanic: 'Jay Oliveros' }
  ],
  [
    { id: 'JO-1169', job: 'JO-1169', date: 'Oct 04, 2026', type: 'Service', customer: 'Jill Esplana', items: 'Tune-up', amount: 17450, status: 'Paid', mechanic: 'Miguel Santos' },
    { id: 'JO-1170', job: 'JO-1170', date: 'Oct 07, 2026', type: 'Service', customer: 'Charles Uy', items: 'Brake service', amount: 18120, status: 'Paid', mechanic: 'Rico Tan' },
    { id: 'JO-1171', job: 'JO-1171', date: 'Oct 09, 2026', type: 'Service', customer: 'Cathy Velasco', items: 'Oil change', amount: 15110, status: 'Outstanding', mechanic: 'Allan Cruz' },
    { id: 'JO-1172', job: 'JO-1172', date: 'Oct 12, 2026', type: 'Service', customer: 'Joel Ramos', items: 'Electrical', amount: 13680, status: 'Paid', mechanic: 'Jay Oliveros' }
  ],
  [
    { id: 'JO-1173', job: 'JO-1173', date: 'Jan 08, 2027', type: 'Service', customer: 'Nikki Malonzo', items: 'Tune-up', amount: 18200, status: 'Paid', mechanic: 'Miguel Santos' },
    { id: 'JO-1174', job: 'JO-1174', date: 'Jan 11, 2027', type: 'Service', customer: 'Rowena Manalo', items: 'Brake service', amount: 19080, status: 'Paid', mechanic: 'Rico Tan' },
    { id: 'JO-1175', job: 'JO-1175', date: 'Jan 14, 2027', type: 'Service', customer: 'Edgar Solis', items: 'Oil change', amount: 16560, status: 'Outstanding', mechanic: 'Allan Cruz' },
    { id: 'JO-1176', job: 'JO-1176', date: 'Jan 18, 2027', type: 'Service', customer: 'Marlon Dela Torre', items: 'Electrical', amount: 14290, status: 'Paid', mechanic: 'Jay Oliveros' }
  ]
];

function getQuarterParts(quarterName) {
  const [, year, quarter] = quarterName.match(/^(\d{4}) Q([1-4])$/);
  return { year: Number(year), startMonth: (Number(quarter) - 1) * 3 };
}

const quarterTransactions = rawQuarterTransactions.slice(0, quarterNames.length).map((rows, quarterIndex) => {
  const { year, startMonth } = getQuarterParts(quarterNames[quarterIndex]);
  return rows.map((transaction, rowIndex) => ({
    ...transaction,
    date: new Date(year, startMonth + (rowIndex % 3), 2 + Math.floor(rowIndex / 3) * 5)
  }));
});

function percentChange(current, previous) {
  return previous ? ((current - previous) / previous) * 100 : 0;
}

function getTier(items, thresholds = defaultThresholds) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const ranked = items.map((item) => ({ ...item, share: total ? (item.value / total) * 100 : 0 })).sort((a, b) => b.share - a.share);
  const top = ranked[0]?.share || 0;
  const topTwo = (ranked[0]?.share || 0) + (ranked[1]?.share || 0);
  const tier = top > thresholds.highTop || topTwo > thresholds.highTopTwo ? 'High' : top >= thresholds.topCategory || topTwo >= thresholds.topTwo ? 'Moderate' : 'Normal';
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

function getDrilldownTransactions({ kind, quarterIndex, label }) {
  const rows = quarterTransactions[quarterIndex] || [];
  if (!kind || !rows.length) return rows;

  if (kind === 'mechanic') {
    return rows.filter((row) => row.mechanic === label || row.mechanic === 'Miguel Santos');
  }

  if (kind === 'service') {
    return rows.filter((row) => ['Brake service', 'Tune-up', 'Oil change', 'Electrical'].includes(row.items));
  }

  return rows;
}

function AIRevenueAnalysis({ dashboardData }) {
  const [qIdx, setQIdx] = useState(quarterLabels.length - 1);
  const [modalId, setModalId] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMonth, setReportMonth] = useState(null);
  const [transactionDrilldown, setTransactionDrilldown] = useState(null);
  const [thresholds, setThresholds] = useState(defaultThresholds);
  const liveRevenue = Number(dashboardData?.stats?.revenue?.value || 0);
  const revenue = useMemo(() => baseRevenue.map((value, index) => index === baseRevenue.length - 1 && liveRevenue ? liveRevenue : value), [liveRevenue]);
  const currentRevenue = revenue[qIdx];
  const previousRevenue = revenue[qIdx - 1] || revenue[qIdx];
  const { year: reportYear, startMonth: reportStartMonth } = getQuarterParts(quarterNames[qIdx]);
  const quarterReportRows = quarterTransactions[qIdx] || [];
  const reportRows = reportMonth === null
    ? quarterReportRows
    : quarterReportRows.filter((transaction) => transaction.date.getMonth() === reportStartMonth + reportMonth);
  const reportTotal = reportRows.reduce((total, transaction) => total + transaction.amount, 0);
  const reportPaid = reportRows.filter((transaction) => transaction.status === 'Paid').reduce((total, transaction) => total + transaction.amount, 0);
  const reportOutstanding = reportTotal - reportPaid;
  const reportMonthName = reportMonth === null
    ? null
    : new Date(reportYear, reportStartMonth + reportMonth, 1).toLocaleString('en-US', { month: 'short' });
  const labor = currentRevenue * .21;
  const parts = currentRevenue * .63;
  const charges = currentRevenue - labor - parts;
  const modal = cardDefinitions.find((card) => card.id === modalId);

  const riskData = useMemo(() => {
    const service = [{ name: 'Brake service', value: currentRevenue * .4 }, { name: 'Engine service', value: currentRevenue * .24 }, { name: 'Oil change', value: currentRevenue * .16 }, { name: 'Electrical', value: currentRevenue * .11 }, { name: 'Other', value: currentRevenue * .09 }];
    const mechanics = ['Miguel Santos', 'Andrea Cruz', 'Rafael Lim', 'Noel Garcia', 'Other'].map((name, index) => ({ name, value: currentRevenue * [0.31, 0.24, 0.19, 0.15, 0.11][index] }));
    const mix = [{ name: 'Parts', value: parts }, { name: 'Labor', value: labor }, { name: 'Charges', value: charges }];
    if (modalId === 'service') return { label: 'Brake service', ...getTier(service, thresholds), items: service };
    if (modalId === 'mechanic') return { label: 'Miguel Santos', ...getTier(mechanics, thresholds), items: mechanics };
    return { label: 'Parts', ...getTier(mix, thresholds), items: mix };
  }, [charges, currentRevenue, labor, modalId, parts, thresholds]);

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
  return (
    <section className="ai-revenue-analysis" aria-labelledby="ai-revenue-title">
      <div className="ai-revenue-analysis__header">
        <div className="ai-revenue-analysis__title"><span className="ai-revenue-analysis__mark">✦</span><div><h2 id="ai-revenue-title">AI Revenue Analysis</h2><p>Generated from current and historical job data</p></div></div>
        <div className="ai-revenue-toolbar">
          <button type="button" className="ai-revenue-toolbar__action" onClick={() => setSettingsOpen(true)}>⚙️ Thresholds</button>
          <button type="button" className="ai-revenue-toolbar__action" onClick={() => { setReportMonth(null); setReportOpen(true); }}>⬇ Export report</button>
        </div>
      </div>
      <div className="ai-revenue-tabs" role="tablist" aria-label="Revenue analysis quarter">
        {quarterLabels.map((label, index) => <button type="button" role="tab" aria-selected={qIdx === index} className={qIdx === index ? 'is-active' : ''} key={label} onClick={() => setQIdx(index)}>{label}</button>)}
      </div>
      {qIdx === quarterLabels.length - 1 && (
        <div className="ai-revenue-completeness-banner">
          <strong>2026 Q1 is still in progress</strong>
          <span>— about 68% of the quarter has elapsed.</span>
        </div>
      )}
      <div className="ai-revenue-summary">
        <div><span>Total revenue - {quarterNames[qIdx]}</span><strong>{peso.format(currentRevenue)}</strong><em className={percentChange(currentRevenue, previousRevenue) >= 0 ? 'is-positive' : 'is-negative'}>{percentChange(currentRevenue, previousRevenue) >= 0 ? '▲' : '▼'} {Math.abs(percentChange(currentRevenue, previousRevenue)).toFixed(1)}% QoQ</em><small>{baseJobs[qIdx]} jobs · avg {peso.format(currentRevenue / baseJobs[qIdx])} per job</small></div>
        <LineChart values={revenue} labels={quarterLabels} />
      </div>
      <div className="ai-revenue-collected-row">
        <div><span>Collected</span><strong>{peso.format(currentRevenue * 0.82)}</strong></div>
        <div><span>Outstanding</span><strong>{peso.format(currentRevenue * 0.18)}</strong></div>
        <div><span>Collection</span><strong>{Math.round((currentRevenue * 0.82 / currentRevenue) * 100)}%</strong></div>
      </div>
      <div className="ai-revenue-cards">
        {cardDefinitions.map((card) => {
          const isNegative = (card.id === 'margin' && qIdx > 0 && partsMargin[qIdx] < partsMargin[qIdx - 1]) || (card.id === 'ops' && overdue[qIdx] > overdue[qIdx - 1]);
          let value = card.id === 'revenue' ? peso.format(currentRevenue) : card.id === 'mix' ? `${Math.round((parts / currentRevenue) * 100)}% from Parts` : card.id === 'service' ? '40% from Brake service' : card.id === 'mechanic' ? '31% from Miguel Santos' : card.id === 'customer' ? `${100 - newCustomerShare[qIdx]}% repeat customers` : card.id === 'season' ? (qIdx >= 4 ? 'Forecast ready' : 'More history needed') : card.id === 'margin' ? `${partsMargin[qIdx]}% parts margin` : `${overdue[qIdx]}% jobs overdue`;
          const pill = card.id === 'mix' ? 'High risk' : card.id === 'service' || card.id === 'mechanic' ? 'Normal risk' : card.id === 'season' ? 'Projection available' : card.id === 'revenue' ? `${percentChange(currentRevenue, previousRevenue) >= 0 ? '+' : ''}${percentChange(currentRevenue, previousRevenue).toFixed(1)}% QoQ` : card.id === 'customer' ? `+${newCustomerShare[qIdx] - newCustomerShare[qIdx - 1] || 0}.0% new-customer share` : card.id === 'margin' ? `${isNegative ? '-' : '+'}${Math.abs(partsMargin[qIdx] - (partsMargin[qIdx - 1] || partsMargin[qIdx])).toFixed(1)}% vs last Q` : `${isNegative ? '+' : '-'}${Math.abs(overdue[qIdx] - (overdue[qIdx - 1] || overdue[qIdx])).toFixed(1)}% vs last Q`;
          return <button type="button" className="ai-revenue-card" key={card.id} onClick={() => setModalId(card.id)}><div className="ai-revenue-card__top"><span className="ai-revenue-card__icon">{card.icon}</span><em className={`ai-revenue-pill ${isNegative ? 'is-bad' : card.id === 'mix' ? 'is-bad' : card.id === 'season' ? 'is-warn' : 'is-good'}`}>{pill}</em></div><strong>{card.title}</strong><b>{value}</b><small>{card.id === 'revenue' ? `${percentChange(currentRevenue, revenue[Math.max(0, qIdx - 4)]).toFixed(1)}% vs same quarter last year` : card.id === 'mix' ? 'Top category share of total revenue' : card.id === 'service' ? 'Share of revenue from one service type' : card.id === 'mechanic' ? 'Revenue generated by top mechanic' : card.id === 'customer' ? 'Repeat revenue is generally more predictable' : card.id === 'season' ? 'Pattern-based projection for next quarter' : card.id === 'margin' ? '(Parts revenue - parts cost) ÷ parts revenue' : peso.format(rejectedRevenue) + ' in approved-but-unbilled findings'}</small></button>;
        })}
      </div>
      {settingsOpen && (
        <div className="ai-revenue-modal-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSettingsOpen(false); }}>
          <section className="ai-revenue-modal ai-revenue-settings" role="dialog" aria-modal="true" aria-labelledby="ai-thresholds-title">
            <button type="button" className="ai-revenue-modal__close" aria-label="Close thresholds" onClick={() => setSettingsOpen(false)}>×</button>
            <p className="ai-revenue-modal__eyebrow">Settings</p>
            <h2 id="ai-thresholds-title">Risk thresholds</h2>
            <div className="ai-revenue-thresholds">
              <label>
                <span>Moderate starts at (top category %)</span>
                <input type="number" min="0" max="100" value={thresholds.topCategory} onChange={(event) => setThresholds((current) => ({ ...current, topCategory: Number(event.target.value) || 0 }))} />
              </label>
              <label>
                <span>High starts at (top category %)</span>
                <input type="number" min="0" max="100" value={thresholds.highTop} onChange={(event) => setThresholds((current) => ({ ...current, highTop: Number(event.target.value) || 0 }))} />
              </label>
              <label>
                <span>Moderate starts at (top 2 %)</span>
                <input type="number" min="0" max="100" value={thresholds.topTwo} onChange={(event) => setThresholds((current) => ({ ...current, topTwo: Number(event.target.value) || 0 }))} />
              </label>
              <label>
                <span>High starts at (top 2 %)</span>
                <input type="number" min="0" max="100" value={thresholds.highTopTwo} onChange={(event) => setThresholds((current) => ({ ...current, highTopTwo: Number(event.target.value) || 0 }))} />
              </label>
            </div>
            <div className="ai-revenue-settings__actions">
              <button type="button" className="ai-revenue-settings__secondary" onClick={() => setThresholds(defaultThresholds)}>Reset to default</button>
              <button type="button" className="ai-revenue-settings__primary" onClick={() => setSettingsOpen(false)}>Apply</button>
            </div>
          </section>
        </div>
      )}
      {reportOpen && (
        <div className="ai-revenue-modal-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setReportOpen(false); }}>
          <section className="ai-revenue-modal ai-revenue-report" role="dialog" aria-modal="true" aria-labelledby="ai-report-title">
            <button type="button" className="ai-revenue-modal__close" aria-label="Close report" onClick={() => setReportOpen(false)}>×</button>
            <p className="ai-revenue-modal__eyebrow">Export</p>
            <h2 id="ai-report-title">Sales / Transactions — {quarterNames[qIdx]}</h2>
            <div className="ai-revenue-report__summary">
              <strong>{reportMonthName ? `${reportMonthName} ${reportYear}` : quarterNames[qIdx]} Sales Report</strong>
              <span>Generated {new Date().toLocaleDateString('en-PH', { day: 'numeric', month: 'long', year: 'numeric' })} · Total: {peso.format(reportTotal)} ({peso.format(reportPaid)} paid, {peso.format(reportOutstanding)} outstanding)</span>
            </div>
            <div className="ai-revenue-report__month-tabs" role="group" aria-label="Filter report by month">
              <button type="button" className={reportMonth === null ? 'is-active' : ''} aria-pressed={reportMonth === null} onClick={() => setReportMonth(null)}>Full quarter</button>
              {[0, 1, 2].map((monthOffset) => {
                const monthName = new Date(reportYear, reportStartMonth + monthOffset, 1).toLocaleString('en-US', { month: 'short' });
                return <button type="button" className={reportMonth === monthOffset ? 'is-active' : ''} aria-pressed={reportMonth === monthOffset} key={monthOffset} onClick={() => setReportMonth(monthOffset)}>{monthName}</button>;
              })}
            </div>
            <div className="ai-revenue-report__table-wrap">
              <table className="ai-revenue-report__table">
                <thead>
                  <tr>
                    <th>Record ID</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Customer</th>
                    <th>Item / Service</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Mechanic</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.length ? reportRows.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{transaction.id}</td>
                      <td>{transaction.date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</td>
                      <td>{transaction.type}</td>
                      <td>{transaction.customer}</td>
                      <td>{transaction.items}</td>
                      <td>{peso.format(transaction.amount)}</td>
                      <td>{transaction.status}</td>
                      <td>{transaction.mechanic}</td>
                    </tr>
                  )) : <tr><td className="ai-revenue-report__empty" colSpan="8">No transactions for this month.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="ai-revenue-settings__actions ai-revenue-settings__actions--report">
              <button type="button" className="ai-revenue-settings__primary" onClick={() => window.print()}>Print / Save as PDF</button>
            </div>
          </section>
        </div>
      )}
      {modal && <div className="ai-revenue-modal-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalId(null); }}><section className="ai-revenue-modal" role="dialog" aria-modal="true" aria-labelledby="ai-modal-title"><button type="button" className="ai-revenue-modal__close" aria-label="Close analysis" onClick={() => setModalId(null)}>×</button><p className="ai-revenue-modal__eyebrow">{quarterNames[qIdx]} analysis</p><h2 id="ai-modal-title">{modal.title}</h2>{modal.kind === 'risk' ? <><div className="ai-revenue-tier-tabs">{['Normal', 'Moderate', 'High'].map((tier) => <span className={riskData.tier === tier ? 'is-active' : ''} key={tier}>{tier}</span>)}</div><div className={`ai-revenue-callout is-${riskData.tier.toLowerCase()}`}><strong>{riskData.tier} concentration</strong><span>{riskData.label} contributes {Math.round((riskData.ranked[0]?.share || 0))}% of revenue.</span></div><HorizontalBars items={riskData.ranked} /><div className="ai-revenue-thresholds__note">Threshold reference: Moderate at {thresholds.topCategory}% top category / {thresholds.topTwo}% top two; High at {thresholds.highTop}% top category / {thresholds.highTopTwo}% top two.</div><h3>Why this risk level</h3><ul className="ai-revenue-modal-list">{riskCopy.why.map((item) => <li key={item}>{item}</li>)}</ul><h3>Recommended actions</h3><ol className="ai-revenue-modal-list ai-revenue-modal-list--numbered">{riskCopy.recs.map((item) => <li key={item}>{item}</li>)}</ol><button type="button" className="ai-revenue-view-transactions" onClick={() => { setTransactionDrilldown({ title: modal.title, rows: getDrilldownTransactions({ kind: modal.id, quarterIndex: qIdx, label: riskData.label }) }); setModalId(null); }}>View transactions →</button></> : <><strong className="ai-revenue-modal__headline">{trendModal.headline}</strong><p className="ai-revenue-modal__detail">{trendModal.detail}</p>{trendModal.chart}<div className="ai-revenue-callout is-normal">{trendModal.callout}</div><h3>Recommended actions</h3><ol className="ai-revenue-modal-list ai-revenue-modal-list--numbered">{trendModal.recs.map((item) => <li key={item}>{item}</li>)}</ol><button type="button" className="ai-revenue-view-transactions" onClick={() => { setTransactionDrilldown({ title: modal.title, rows: getDrilldownTransactions({ kind: modal.id, quarterIndex: qIdx, label: riskData.label }) }); setModalId(null); }}>View transactions →</button></>}</section></div>}
      {transactionDrilldown && (
        <div className="ai-revenue-modal-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setTransactionDrilldown(null); }}>
          <section className="ai-revenue-modal ai-revenue-drilldown" role="dialog" aria-modal="true" aria-labelledby="ai-drilldown-title">
            <button type="button" className="ai-revenue-modal__close" aria-label="Close transactions" onClick={() => setTransactionDrilldown(null)}>×</button>
            <p className="ai-revenue-modal__eyebrow">Transactions</p>
            <h2 id="ai-drilldown-title">{transactionDrilldown.title}</h2>
            <div className="ai-revenue-report__table-wrap ai-revenue-report__table-wrap--drilldown">
              <table className="ai-revenue-report__table">
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Customer</th>
                    <th>Mechanic</th>
                    <th>Amount</th>
                    <th>Paid / Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionDrilldown.rows.map((row) => (
                    <tr key={`${row.job}-${row.customer}`}>
                      <td>{row.job}</td>
                      <td>{row.customer}</td>
                      <td>{row.mechanic}</td>
                      <td>{peso.format(row.amount)}</td>
                      <td>{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

export default AIRevenueAnalysis;
import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import EmptyState from '../common/EmptyState';

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });

function SalesChart({ series, loading, period, compact = false }) {
  const canvasRef = useRef(null);
  const [hovered, setHovered] = useState(null);
  const latest = series.at(-1);
  const readout = hovered?.period === period ? hovered.item : latest;

  useEffect(() => {
    if (!canvasRef.current || !series.length) return undefined;
    const values = series.map((item) => Number(item.value || 0));
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const chart = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: series.map((item) => item.label),
        datasets: [{
          data: values,
          backgroundColor: values.map((_, index) => index === values.length - 1 ? '#FFC08F' : '#F26A1B'),
          borderRadius: 7,
          borderSkipped: false,
          maxBarThickness: 72,
          categoryPercentage: 0.72,
          barPercentage: 0.9
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: reduceMotion ? 0 : 220 },
        layout: { padding: { top: 12, right: 10, bottom: 0, left: 0 } },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: '#CDB09D', font: { family: 'Plus Jakarta Sans, system-ui, sans-serif', size: 12, weight: '600' }, maxRotation: 0, autoSkip: compact, maxTicksLimit: compact ? 6 : 12 }
          },
          y: {
            beginAtZero: true,
            border: { display: false },
            grid: { color: 'rgba(255,255,255,.1)', drawTicks: false },
            ticks: {
              color: '#CDB09D',
              padding: 10,
              maxTicksLimit: 5,
              font: { family: 'Plus Jakarta Sans, system-ui, sans-serif', size: 11 },
              callback: (value) => Number(value) >= 1000 ? `${Number(value) % 1000 ? (Number(value) / 1000).toFixed(1) : Number(value) / 1000}k` : value
            }
          }
        },
        onHover: (_event, activeElements) => {
          const active = activeElements[0];
          setHovered(active ? { period, item: series[active.index] } : null);
        }
      },
      plugins: [{
        id: 'admin-average-line',
        afterDatasetsDraw(currentChart) {
          const { ctx, chartArea, scales } = currentChart;
          const y = scales.y.getPixelForValue(average);
          ctx.save();
          ctx.setLineDash([5, 5]);
          ctx.strokeStyle = 'rgba(255,255,255,.52)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(chartArea.left, y);
          ctx.lineTo(chartArea.right, y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#F6E8DD';
          ctx.font = '600 11px Plus Jakarta Sans, system-ui, sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(`avg ${peso.format(average)}`, chartArea.right - 2, y - 7);
          ctx.restore();
        }
      }]
    });

    return () => chart.destroy();
  }, [series, compact, period]);

  if ((!series.length || !series.some((item) => Number(item.value) > 0)) && !loading) return <EmptyState>No sales yet. Confirmed orders will appear here.</EmptyState>;
  if (!series.length) return <div className="admin-sales-chart__skeleton" role="status" aria-label="Loading sales chart" />;

  return (
    <div className="admin-sales-chart" role="img" aria-label={`Sales by ${period}: ${series.map((item) => `${item.label} ${peso.format(item.value)}`).join(', ')}`}>
      <p className="admin-sales-chart__readout" aria-live="polite">
        <span>{readout?.label || ''}</span>
        <strong>{peso.format(readout?.value || 0)}</strong>
        {loading && <span className="admin-sales-chart__updating">Updating</span>}
      </p>
      <div className="admin-sales-chart__canvas"><canvas ref={canvasRef} aria-hidden="true" /></div>
    </div>
  );
}

export default SalesChart;

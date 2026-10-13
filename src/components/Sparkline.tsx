import React from 'react';
import { SparklineConfig } from '../types/spreadsheet';

interface SparklineProps {
  config: SparklineConfig;
  width?: number | string;
  height?: number | string;
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  config,
  width = '100%',
  height = '100%',
  className = '',
}) => {
  const { data = [], type = 'line', color = '#107c41', fillColor } = config;

  if (!data || data.length === 0) {
    return <span className="text-[10px] text-neutral-400 italic">No data</span>;
  }

  // Filter numeric values
  const values = data.map((d) => (typeof d === 'number' && !isNaN(d) ? d : 0));
  if (values.length === 0) return null;

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  // Render Bar Sparkline
  if (type === 'bar') {
    const barCount = values.length;
    const svgWidth = 100;
    const svgHeight = 22;
    const padding = 2;
    const gap = 2;
    const availableWidth = svgWidth - padding * 2 - (barCount - 1) * gap;
    const barWidth = Math.max(2, availableWidth / barCount);

    // Baseline calculation: if minVal < 0 and maxVal > 0, baseline is proportional
    let baselineY = svgHeight - padding;
    if (minVal < 0 && maxVal > 0) {
      baselineY = padding + ((maxVal) / range) * (svgHeight - padding * 2);
    } else if (maxVal <= 0) {
      baselineY = padding;
    }

    return (
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className={`w-full h-full block ${className}`}
        preserveAspectRatio="none"
      >
        {/* Subtle zero baseline if mixed signs */}
        {minVal < 0 && maxVal > 0 && (
          <line
            x1={padding}
            y1={baselineY}
            x2={svgWidth - padding}
            y2={baselineY}
            stroke="#94a3b8"
            strokeWidth="0.75"
            strokeDasharray="2,2"
          />
        )}

        {values.map((val, idx) => {
          const x = padding + idx * (barWidth + gap);
          let y = baselineY;
          let h = 0;

          if (val >= 0) {
            const barH = (val / (maxVal || 1)) * (baselineY - padding);
            h = Math.max(1.5, barH);
            y = baselineY - h;
          } else {
            const barH = (Math.abs(val) / Math.abs(minVal || 1)) * (svgHeight - padding - baselineY);
            h = Math.max(1.5, barH);
            y = baselineY;
          }

          // Negative bars in crimson/rose, positive in given color
          const barColor = val < 0 ? '#ef4444' : color;

          return (
            <rect
              key={idx}
              x={x}
              y={y}
              width={barWidth}
              height={h}
              fill={barColor}
              rx={0.5}
            >
              <title>{`Value ${idx + 1}: ${val}`}</title>
            </rect>
          );
        })}
      </svg>
    );
  }

  // Render Line Sparkline
  const svgWidth = 100;
  const svgHeight = 22;
  const padX = 4;
  const padY = 3;
  const stepX = values.length > 1 ? (svgWidth - padX * 2) / (values.length - 1) : 0;

  const points = values.map((val, idx) => {
    const x = padX + idx * stepX;
    // Map value to Y: high values are near top (small Y)
    const normalizedY = (val - minVal) / range;
    const y = svgHeight - padY - normalizedY * (svgHeight - padY * 2);
    return { x, y, val };
  });

  const polylineStr = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPolyStr = points.length > 1
    ? `${points[0].x.toFixed(1)},${svgHeight - padY} ${polylineStr} ${points[points.length - 1].x.toFixed(1)},${svgHeight - padY}`
    : '';

  const lastPoint = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className={`w-full h-full block ${className}`}
      preserveAspectRatio="none"
    >
      {/* Optional area fill */}
      {areaPolyStr && (
        <polygon
          points={areaPolyStr}
          fill={fillColor || `${color}25`}
        />
      )}

      {/* Main line */}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={polylineStr}
      />

      {/* Dot at latest data point */}
      {lastPoint && (
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="2.2"
          fill={color}
          stroke="#ffffff"
          strokeWidth="0.75"
        >
          <title>{`Latest: ${lastPoint.val}`}</title>
        </circle>
      )}

      {/* Min and Max highlight markers if distinct */}
      {points.map((p, i) => {
        if (p.val === minVal && minVal < 0) {
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="1.8"
              fill="#ef4444"
            >
              <title>{`Min: ${p.val}`}</title>
            </circle>
          );
        }
        return null;
      })}
    </svg>
  );
};

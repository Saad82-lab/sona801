import React, { useState, useRef } from 'react';
import { X, Download, BarChart3, LineChart, PieChart, AreaChart } from 'lucide-react';
import { SheetData } from '../types/spreadsheet';
import { colNameToIndex, colIndexToName } from '../engine/evaluator';

interface ChartModalProps {
  isOpen: boolean;
  initialType?: 'bar' | 'line' | 'pie' | 'area';
  sheet: SheetData;
  darkMode: boolean;
  onClose: () => void;
}

export const ChartModal: React.FC<ChartModalProps> = ({
  isOpen,
  initialType = 'bar',
  sheet,
  darkMode,
  onClose,
}) => {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'area'>(initialType);
  const [labelCol, setLabelCol] = useState('A');
  const [dataCol, setDataCol] = useState('B');
  const [chartTitle, setChartTitle] = useState('Spreadsheet Data Visualization');
  const svgRef = useRef<SVGSVGElement>(null);

  // Extract label and data points from the sheet
  const { labels, values } = React.useMemo(() => {
    if (!isOpen) {
      return { labels: [], values: [] };
    }
    const lCol = labelCol.toUpperCase().trim();
    const dCol = dataCol.toUpperCase().trim();
    const extractedLabels: string[] = [];
    const extractedValues: number[] = [];

    // Scan up to first 40 rows
    for (let r = 1; r <= Math.min(sheet.rowCount, 40); r++) {
      const dCell = sheet.cells[`${dCol}${r}`];
      const lCell = sheet.cells[`${lCol}${r}`];

      if (dCell && (dCell.raw || dCell.computed !== undefined)) {
        const num = dCell.computed !== undefined && typeof dCell.computed === 'number'
          ? dCell.computed
          : parseFloat(dCell.raw);

        if (!isNaN(num)) {
          const labelText = lCell ? (lCell.computed !== undefined ? String(lCell.computed) : lCell.raw) : `Row ${r}`;
          extractedLabels.push(labelText || `Row ${r}`);
          extractedValues.push(num);
        }
      }
    }

    return {
      labels: extractedLabels.length ? extractedLabels : ['Sample 1', 'Sample 2', 'Sample 3', 'Sample 4'],
      values: extractedValues.length ? extractedValues : [42, 85, 23, 67],
    };
  }, [isOpen, sheet, labelCol, dataCol]);

  if (!isOpen) return null;

  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;

  const colors = [
    '#107c41', '#1a73e8', '#e8710a', '#9334e6', '#007b83',
    '#dc2626', '#059669', '#d97706', '#2563eb', '#ec4899'
  ];

  const handleExportPNG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    canvas.width = 800;
    canvas.height = 450;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = darkMode ? '#1e1e1e' : '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const a = document.createElement('a');
        a.download = `${chartTitle.replace(/\s+/g, '_')}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-3xl rounded-2xl shadow-2xl border p-5 flex flex-col gap-4 animate-pop ${
        darkMode ? 'bg-[#252525] border-neutral-700 text-neutral-100' : 'bg-white border-neutral-200 text-neutral-900'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#107c41]" />
            <h3 className="font-bold text-base">Excel Chart Studio</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-neutral-500">Chart Type</label>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setChartType('bar')}
                className={`p-1.5 rounded border flex-1 flex items-center justify-center ${
                  chartType === 'bar' ? 'bg-[#107c41] text-white border-[#107c41]' : 'border-neutral-300 dark:border-neutral-700'
                }`}
                title="Bar Chart"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`p-1.5 rounded border flex-1 flex items-center justify-center ${
                  chartType === 'line' ? 'bg-[#107c41] text-white border-[#107c41]' : 'border-neutral-300 dark:border-neutral-700'
                }`}
                title="Line Graph"
              >
                <LineChart className="w-4 h-4" />
              </button>
              <button
                onClick={() => setChartType('pie')}
                className={`p-1.5 rounded border flex-1 flex items-center justify-center ${
                  chartType === 'pie' ? 'bg-[#107c41] text-white border-[#107c41]' : 'border-neutral-300 dark:border-neutral-700'
                }`}
                title="Pie Chart"
              >
                <PieChart className="w-4 h-4" />
              </button>
              <button
                onClick={() => setChartType('area')}
                className={`p-1.5 rounded border flex-1 flex items-center justify-center ${
                  chartType === 'area' ? 'bg-[#107c41] text-white border-[#107c41]' : 'border-neutral-300 dark:border-neutral-700'
                }`}
                title="Area Chart"
              >
                <AreaChart className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-neutral-500">Label Column (e.g. A)</label>
            <input
              type="text"
              value={labelCol}
              onChange={(e) => setLabelCol(e.target.value.toUpperCase())}
              className="w-full px-2 py-1.5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 uppercase font-mono font-bold outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-neutral-500">Data Column (e.g. B or E)</label>
            <input
              type="text"
              value={dataCol}
              onChange={(e) => setDataCol(e.target.value.toUpperCase())}
              className="w-full px-2 py-1.5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 uppercase font-mono font-bold outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-neutral-500">Chart Title</label>
            <input
              type="text"
              value={chartTitle}
              onChange={(e) => setChartTitle(e.target.value)}
              className="w-full px-2 py-1.5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 outline-none"
            />
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="w-full h-80 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 flex items-center justify-center overflow-hidden">
          <svg
            ref={svgRef}
            viewBox="0 0 700 320"
            className="w-full h-full"
          >
            {/* Chart Title */}
            <text
              x="350"
              y="25"
              textAnchor="middle"
              fill={darkMode ? '#e5e5e5' : '#1f1f1f'}
              fontSize="14"
              fontWeight="bold"
            >
              {chartTitle}
            </text>

            {/* BAR CHART */}
            {chartType === 'bar' && (
              <g transform="translate(60, 45)">
                {/* Axes */}
                <line x1="0" y1="230" x2="600" y2="230" stroke={darkMode ? '#444' : '#ccc'} strokeWidth="1" />
                <line x1="0" y1="0" x2="0" y2="230" stroke={darkMode ? '#444' : '#ccc'} strokeWidth="1" />

                {values.map((v, i) => {
                  const barWidth = Math.min(48, 560 / values.length - 8);
                  const barHeight = Math.max(4, ((v - Math.min(0, minVal)) / (range || 1)) * 200);
                  const x = 20 + i * (barWidth + 8);
                  const y = 230 - barHeight;
                  const color = colors[i % colors.length];

                  return (
                    <g key={i}>
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill={color}
                        rx="3"
                        className="transition-all hover:opacity-80"
                      />
                      {/* Value label */}
                      <text
                        x={x + barWidth / 2}
                        y={y - 5}
                        textAnchor="middle"
                        fill={darkMode ? '#aaa' : '#555'}
                        fontSize="10"
                        fontFamily="monospace"
                      >
                        {v}
                      </text>
                      {/* X Label */}
                      <text
                        x={x + barWidth / 2}
                        y="245"
                        textAnchor="middle"
                        fill={darkMode ? '#aaa' : '#666'}
                        fontSize="9"
                      >
                        {labels[i]?.substring(0, 8)}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* LINE CHART */}
            {chartType === 'line' && (
              <g transform="translate(60, 45)">
                <line x1="0" y1="230" x2="600" y2="230" stroke={darkMode ? '#444' : '#ccc'} strokeWidth="1" />
                <line x1="0" y1="0" x2="0" y2="230" stroke={darkMode ? '#444' : '#ccc'} strokeWidth="1" />

                {/* Path calculation */}
                {(() => {
                  const step = 560 / Math.max(1, values.length - 1);
                  const points = values.map((v, i) => {
                    const x = 20 + i * step;
                    const y = 230 - ((v - Math.min(0, minVal)) / (range || 1)) * 200;
                    return `${x},${y}`;
                  }).join(' ');

                  return (
                    <>
                      <polyline
                        fill="none"
                        stroke="#107c41"
                        strokeWidth="3"
                        points={points}
                      />
                      {values.map((v, i) => {
                        const x = 20 + i * step;
                        const y = 230 - ((v - Math.min(0, minVal)) / (range || 1)) * 200;
                        return (
                          <g key={i}>
                            <circle cx={x} cy={y} r="4" fill="#107c41" stroke="#fff" strokeWidth="2" />
                            <text x={x} y={y - 8} textAnchor="middle" fill={darkMode ? '#aaa' : '#444'} fontSize="10">
                              {v}
                            </text>
                            <text x={x} y="245" textAnchor="middle" fill={darkMode ? '#888' : '#666'} fontSize="9">
                              {labels[i]?.substring(0, 8)}
                            </text>
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </g>
            )}

            {/* AREA CHART */}
            {chartType === 'area' && (
              <g transform="translate(60, 45)">
                {(() => {
                  const step = 560 / Math.max(1, values.length - 1);
                  const pts = values.map((v, i) => {
                    const x = 20 + i * step;
                    const y = 230 - ((v - Math.min(0, minVal)) / (range || 1)) * 200;
                    return `${x},${y}`;
                  });
                  const polyPoints = `20,230 ${pts.join(' ')} ${20 + (values.length - 1) * step},230`;

                  return (
                    <>
                      <polygon
                        fill="rgba(16, 124, 65, 0.25)"
                        stroke="#107c41"
                        strokeWidth="2"
                        points={polyPoints}
                      />
                      <line x1="0" y1="230" x2="600" y2="230" stroke={darkMode ? '#444' : '#ccc'} strokeWidth="1" />
                    </>
                  );
                })()}
              </g>
            )}

            {/* PIE CHART */}
            {chartType === 'pie' && (
              <g transform="translate(350, 160)">
                {(() => {
                  const total = values.reduce((a, b) => a + Math.max(0, b), 0) || 1;
                  let currentAngle = 0;
                  const radius = 100;

                  return values.map((v, i) => {
                    const sliceAngle = (Math.max(0, v) / total) * 2 * Math.PI;
                    const x1 = radius * Math.cos(currentAngle);
                    const y1 = radius * Math.sin(currentAngle);
                    const x2 = radius * Math.cos(currentAngle + sliceAngle);
                    const y2 = radius * Math.sin(currentAngle + sliceAngle);
                    const largeArc = sliceAngle > Math.PI ? 1 : 0;
                    const pathData = `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
                    currentAngle += sliceAngle;
                    const color = colors[i % colors.length];

                    return (
                      <path
                        key={i}
                        d={pathData}
                        fill={color}
                        stroke={darkMode ? '#252525' : '#ffffff'}
                        strokeWidth="2"
                      />
                    );
                  });
                })()}
              </g>
            )}
          </svg>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t pt-3 border-neutral-200 dark:border-neutral-700">
          <div className="text-xs text-neutral-400">
            {values.length} data points mapped from Column {dataCol}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPNG}
              className="px-4 py-1.5 bg-[#107c41] text-white hover:bg-[#0c6334] rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export as PNG</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 rounded-lg text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import './EChart.css';

interface EChartProps {
  option: echarts.EChartsOption;
  height?: number;
  className?: string;
}

const EChart: React.FC<EChartProps> = ({ option, height = 280, className = '' }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    chartInstance.current.setOption(option, true);

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [option]);

  // 主题变化时重绘
  useEffect(() => {
    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  return (
    <div
      ref={chartRef}
      className={`echart-container ${className}`}
      style={{ width: '100%', height }}
    />
  );
};

export default EChart;

import React, { forwardRef, useMemo } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
  Chart
} from 'chart.js';
import { PolarArea } from 'react-chartjs-2';
import { FlavorAttribute } from '../types';

// Register Chart.js components
ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend);

import { useLanguage } from '../context/LanguageContext';
import { currentConfig } from '../constants';
import { getAttributeColor } from '../utils/colors';

interface FlavorRadarProps {
  attributes: FlavorAttribute[];
  height?: string;
  hideTitle?: boolean;
  className?: string;
}

const FlavorRadar = React.memo(forwardRef<Chart<'polarArea'> | null | undefined, FlavorRadarProps>(({ attributes, height = '500px', hideTitle = false, className = '' }, ref) => {
  const { language } = useLanguage();
  // Order logic driven by config
  const order = useMemo(() => {
    return currentConfig.meta.radarAttributeIds || currentConfig.attributes.map(a => a.id);
  }, []);

  // ... (label and color logic remains) ...

  const getLabel = (id: string, attr: FlavorAttribute | undefined) => {
    let text = '';
    const configAttr = currentConfig.attributes.find(a => a.id === id);

    // Use config label if available, otherwise attribute name, otherwise ID
    if (configAttr) {
      text = language === 'es' ? configAttr.nameEs : configAttr.nameEn;
    } else {
      text = attr ? (language === 'es' ? attr.nameEs : attr.nameEn) : id;
    }

    // Handle generic newlines if encoded in string (optional, usually config strings are plain)
    // If strict wrapping is needed, it can be done here.
    return text.split('\n');
  };



  // Prepare Data using useMemo
  const chartLabels = useMemo(() => order.map(id => {
    const attr = attributes.find(a => a.id === id);
    return getLabel(id, attr);
  }), [attributes, language, order]);

  const chartDataScores = useMemo(() => order.map(id => {
    const attr = attributes.find(a => a.id === id);
    return attr ? attr.score : 0;
  }), [attributes, order]);

  const chartColors = useMemo(() => order.map(id => getAttributeColor(id)), [order]);

  const data = useMemo(() => ({
    labels: chartLabels,
    datasets: [
      {
        label: 'Score',
        data: chartDataScores,
        backgroundColor: chartColors,
        borderWidth: 2, // Visible borders
        borderColor: '#ffffff', // White separators
      },
    ],
  }), [chartLabels, chartDataScores, chartColors]);

  const options: ChartOptions<'polarArea'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0 // Disable animation for immediate updates
    },
    layout: {
      padding: 0
    },
    scales: {
      r: {
        min: 0,
        max: 10,
        ticks: {
          stepSize: 2,
          z: 1, // Draw ticks above background
          backdropColor: 'transparent', // No background box for numbers
          color: '#8c5e4a',
          font: {
            size: 8 // Smaller font for smaller charts
          }
        },
        grid: {
          color: '#eaddd7',
          circular: true,
        },
        angleLines: {
          display: true,
          color: '#eaddd7',
        },
        pointLabels: {
          display: true,
          centerPointLabels: true,
          font: {
            size: 8, // Smaller font for smaller charts
            family: 'sans-serif',
            weight: 'bold',
          },
          color: '#4a2e24',
          padding: 2
        }
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#5e3a2e',
        bodyColor: '#5e3a2e',
        borderColor: '#eaddd7',
        borderWidth: 1,
        callbacks: {
          title: (context) => {
            const label = context[0].label;
            return Array.isArray(label) ? label.join(' ') : label;
          }
        }
      },
    },
  }), []);

  return (
    <div className={`w-full bg-white rounded-xl shadow-sm border border-brand-100 p-1 flex flex-col ${className}`} style={{ height }}>
      {!hideTitle && (
        <h3 className="text-center font-serif text-brand-800 text-lg mb-2 flex-none pt-2">
          {language === 'es' ? 'Gráfico de Sabor' : 'Flavor Profile'}
        </h3>
      )}
      <div className="flex-1 w-full relative min-h-0">
        <PolarArea ref={ref} data={data} options={options} />
      </div>
    </div>
  );
}));

FlavorRadar.displayName = 'FlavorRadar';

export default FlavorRadar;
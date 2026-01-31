import React, { forwardRef, useMemo } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { PolarArea } from 'react-chartjs-2';
import { FlavorAttribute } from '../types';

// Register Chart.js components
ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend);

import { useLanguage } from '../context/LanguageContext';

interface FlavorRadarProps {
  attributes: FlavorAttribute[];
  height?: string;
  hideTitle?: boolean;
  className?: string;
}

const FlavorRadar = React.memo(forwardRef<any, FlavorRadarProps>(({ attributes, height = '500px', hideTitle = false, className = '' }, ref) => {
  const { language } = useLanguage();
  // Order logic matches standard CoEx flow
  const order = useMemo(() => [
    'cacao',
    'acidity',
    'bitterness',
    'astringency',
    'fresh_fruit',
    'browned_fruit',
    'vegetal',
    'floral',
    'woody',
    'spice',
    'nutty',
    'caramel',
    'sweetness',
    'defects',
    'roast'
  ], []);

  // ... (label and color logic remains) ...

  const getLabel = (id: string, attr: FlavorAttribute | undefined) => {
    let text = '';

    if (language === 'es') {
      switch (id) {
        case 'roast': text = 'TOSTADO'; break;
        case 'acidity': text = 'ACIDEZ'; break;
        case 'fresh_fruit': text = 'FRUTA\nFRESCA'; break;
        case 'browned_fruit': text = 'FRUTA\nMARRÓN'; break;
        case 'vegetal': text = 'VEGETAL'; break;
        case 'floral': text = 'FLORAL'; break;
        case 'woody': text = 'MADERA'; break;
        case 'spice': text = 'ESPECIA'; break;
        case 'nutty': text = 'NUEZ'; break;
        case 'caramel': text = 'CARAMELO /\nPANELA'; break;
        case 'sweetness': text = 'DULZOR\n(solo chocolate)'; break;
        case 'defects': text = 'SABORES\nATÍPICOS'; break;
        case 'cacao': text = 'CACAO'; break;
        case 'bitterness': text = 'AMARGOR'; break;
        case 'astringency': text = 'ASTRINGENCIA'; break;
        default: text = attr ? attr.nameEs : id;
      }
    } else {
      switch (id) {
        case 'roast': text = 'ROAST'; break;
        case 'acidity': text = 'ACIDITY'; break;
        case 'fresh_fruit': text = 'FRESH\nFRUIT'; break;
        case 'browned_fruit': text = 'BROWNED\nFRUIT'; break;
        case 'vegetal': text = 'VEGETAL'; break;
        case 'floral': text = 'FLORAL'; break;
        case 'woody': text = 'WOODY'; break;
        case 'spice': text = 'SPICE'; break;
        case 'nutty': text = 'NUTTY'; break;
        case 'caramel': text = 'CARAMEL /\nPANELA'; break;
        case 'sweetness': text = 'SWEETNESS\n(only chocolate)'; break;
        case 'defects': text = 'OFF-FLAVOURS'; break;
        case 'cacao': text = 'CACAO'; break;
        case 'bitterness': text = 'BITTERNESS'; break;
        case 'astringency': text = 'ASTRINGENCIA'; break;
        default: text = attr ? attr.nameEn : id;
      }
    }

    // Chart.js accepts arrays for multi-line labels
    return text.split('\n');
  };

  const getColor = (id: string) => {
    switch (id) {
      case 'cacao': return '#754c29';
      case 'bitterness': return '#a01f65';
      case 'astringency': return '#366d99';
      case 'roast': return '#ebab21';
      case 'acidity': return '#00954c';
      case 'fresh_fruit': return '#f6d809';
      case 'browned_fruit': return '#431614';
      case 'vegetal': return '#006260';
      case 'floral': return '#8dc63f';
      case 'woody': return '#a97c50';
      case 'spice': return '#c33d32';
      case 'nutty': return '#a0a368';
      case 'caramel': return '#bd7844';
      case 'sweetness': return '#ffc6e0';
      case 'defects': return '#a7a9ac';
      default: return '#a0785a';
    }
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

  const chartColors = useMemo(() => order.map(id => getColor(id)), [order]);

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
    <div className={`w-full bg-white rounded-xl shadow-sm border border-cacao-100 p-1 flex flex-col ${className}`} style={{ height }}>
      {!hideTitle && (
        <h3 className="text-center font-serif text-cacao-800 text-lg mb-2 flex-none pt-2">
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
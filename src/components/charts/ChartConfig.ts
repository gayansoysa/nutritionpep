import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler
);

// Common chart options
export const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 12,
        },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
      padding: 12,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          size: 11,
        },
      },
    },
    y: {
      grid: {
        color: 'rgba(0, 0, 0, 0.1)',
      },
      ticks: {
        font: {
          size: 11,
        },
      },
    },
  },
};

// Color palette for charts
export const chartColors = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  calories: '#ff6b6b',
  protein: '#4ecdc4',
  carbs: '#45b7d1',
  fat: '#f9ca24',
  fiber: '#6c5ce7',
  gradient: {
    calories: ['#ff6b6b', '#ff8e8e'],
    protein: ['#4ecdc4', '#7ed6d1'],
    carbs: ['#45b7d1', '#6bc5d8'],
    fat: ['#f9ca24', '#fad648'],
    fiber: ['#6c5ce7', '#8b7ced'],
  },
};

// Animation configurations
export const animations = {
  smooth: {
    duration: 1000,
    easing: 'easeInOutQuart' as const,
  },
  fast: {
    duration: 500,
    easing: 'easeOutQuart' as const,
  },
  bounce: {
    duration: 1200,
    easing: 'easeOutBounce' as const,
  },
};

// Export Chart.js for use in components
export { ChartJS };
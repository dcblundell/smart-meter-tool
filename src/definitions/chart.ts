import { type ChartConfiguration } from 'chart.js';

const LINE_CHART_CONFIG: Omit<ChartConfiguration<'line'>, 'data'> = {
  type: 'line',
  options: {
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y != null) label += context.parsed.y.toFixed(2);
            return label;
          },
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  }
}

export const COMPARE_GAS_CONFIG: Omit<ChartConfiguration<'line'>, 'data'> = {
  ...LINE_CHART_CONFIG,
  options: {
    ...LINE_CHART_CONFIG.options,
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Temperature (°C)',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Cost ($)',
        },
      },
    },
  },
};

export const COMPARE_RATES_CONFIG: Omit<ChartConfiguration<'line'>, 'data'> = {
  ...LINE_CHART_CONFIG,
  options: {
    ...LINE_CHART_CONFIG.options,
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Cost ($)',
        },
      },
    },
  },
};

import { type ChartConfiguration } from 'chart.js';

export const LINE_CHART_CONFIG: Omit<ChartConfiguration<'line'>, 'data'> = {
  type: 'line',
  options: {
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Temperature (°C)',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Cost ($)',
        },
      },
      // y2: {
      //   type: "linear",
      //   display: true,
      //   position: "right",
      //   grid: {
      //     drawOnChartArea: false,
      //   },
      //   title: {
      //     display: true,
      //     text: "Heating kWh",
      //   },
      //   offset: true,
      // },
    },
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
  },
};

import React from "react";
import { Line } from "react-chartjs-2";
import Chart from 'chart.js/auto';

function setupChartOptions(title, subtitle) {
  return {
    color: "#dee2e6",
    plugins: {
      title: {
        display: true,
        text: title,
        color: "#dee2e6",
        font: {
          size: 20
        }
      },
      subtitle: {
        display: true,
        text: subtitle,
        align: "end",
        color: "#aaaaaa",
        font: {
          style: 'italic'
        }
      },
      chartAreaBorder: {
        borderColor: '#cacaca',
        borderWidth: 1
      }
    },
    scaleShowValues: true,
    scales: {
      x: {
        title: {
          display: true,
          text: "Level",
          color: "#dee2e6",
          font: {
              size: 16
          }
        },
        ticks: {
          color: "#d4d4d4",
          autoSkip: false
        },
        grid: {
          color: "#202020"
        }
      },
      y: {
        title: {
          display: true,
          text: "Average Score",
          color: "#dee2e6",
          font: {
            size: 16
          }
        },
        min: 850000,
        max: 1000000,
        ticks: {
          color: "#d4d4d4",
          stepSize: 10000
        },
        grid: {
          color: "#202020"
        }
      },
      y1: {
        title: {
          display: true,
          text: "Cleared",
          color: "#dee2e6",
          font: {
            size: 16
          }
        },
        position: 'right',
        min: 0.00,
        max: 1.00,
        ticks: {
          color: "#d4d4d4",
          format: {
            style: "percent"
          }
        },
        grid: {
          drawOnChartArea: false
        }
      }
    }
  }
}

function setupChartPlugins() {
  return [{
    id: 'chartAreaBorder',
    afterDraw(chart, args, options) {
        const {ctx, chartArea: {left, top, width, height}} = chart;
        ctx.save();
        ctx.strokeStyle = options.borderColor;
        ctx.lineWidth = options.borderWidth;
        ctx.setLineDash(options.borderDash || []);
        ctx.lineDashOffset = options.borderDashOffset;
        ctx.strokeRect(left, top, width, height);
        ctx.restore();
    }
  }];
}

function LineChart({ innerRef, chartData, title, subtitle }) {
  const chartOptions = setupChartOptions(title, subtitle);
  const plugins = setupChartPlugins();
  return ( 
    <Line ref={innerRef}
      data={chartData}
      options={chartOptions}
      plugins={plugins}
    />
  )
}

export default LineChart;
import React from "react";
import { Bar } from "react-chartjs-2";
import Chart from 'chart.js/auto';

function loadOptions(cutoffs) {
    const max = cutoffs[cutoffs.length - 1].value;
    const stepSize = max / cutoffs.length; // assumes rating cutoffs are evenly spaced towards the final cutoff!
    return {
        indexAxis: 'y',
        elements: {
            bar: {
                borderWidth: 2,
            }
        },
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            }
        },
        scales: {
            x: {
                position: "top",
                border: {
                    display: false
                },
                min: 0,
                max: cutoffs[cutoffs.length - 1].value,
                grid: {
                    color: "white",
                    drawTicks: false,
                    lineWidth: 2,
                    z: 1
                },
                ticks: {
                    color: "white",
                    stepSize: stepSize,
                    callback: (val) => {
                        for (const idx in cutoffs) {
                            if(val===cutoffs[idx].value) {
                                return cutoffs[idx].name;
                            }
                        }
                    }
                }
            },
            y: {
                ticks: {
                    font: {
                        size: 16
                    },
                    color: "white"
                }
            }
        }
    }
}

function BarChart({cutoffs, rating}) {
    const options = loadOptions(cutoffs);
    let percentage = Math.round(rating/cutoffs[cutoffs.length-1]["value"]*100);
    percentage = percentage > 100 ? 100 : percentage;

    const labels = [`${percentage}%`];
    const data = {
        labels,
        datasets: [
          {
            label: 'Rating',
            data: [rating],
            backgroundColor: "rgb(20, 200, 130)",
            borderColor: "rgb(44, 133, 88)",
            borderRadius: Number.MAX_VALUE,
            barPercentage: 1.0
          }
        ]
      };
    return (
    <div style={{height: "50px"}}>
        <Bar options={options} data={data} />
    </div>
    );
}

export default BarChart;
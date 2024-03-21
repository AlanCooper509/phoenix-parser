import React from "react";
import { Bar } from "react-chartjs-2";
import Chart from 'chart.js/auto';

const labels = [
    ["Lower | B", "(0 ~ 749k)"],
    ["A | +", "(750k ~ 899k)"],
    ["AA | + ", "(900k ~ 949k)"],
    ["AAA | +  ", "(950k ~ 969k)"],
    ["S | +", "(970k ~ 979k)"],
    ["SS | + ", "(980k ~ 989k)"],
    ["SSS | +  ", "(990k ~ 1m)"]
];

const backgroundColors = [
    '#13aa7d',
    '#993f0d',
    '#993f0d',
    '#d9d7d4',
    '#efbf00',
    '#efbf00',
    '#6bd8ff'
]

function setupChartOptions(title, subtitle, yMax) {
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
                color: "#aaaaaa",
                font: {
                    style: 'italic'
                },
                padding: {
                    bottom: 15
                }
            },
            legend: {
                display: false
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
                    display: false,
                    text: "Grade",
                    color: "#dee2e6",
                    font: {
                        size: 16
                    }
                },
                ticks: {
                    color: "#d4d4d4",
                    autoSkip: false,
                    font: {
                        size: 14
                    }
                },
                grid: {
                    color: "#202020"
                },
                offset: true
            },
            y: {
                title: {
                    display: false,
                    text: "Count",
                    color: "#dee2e6",
                    font: {
                        size: 16
                    }
                },
                min: 0,
                max: yMax,
                ticks: {
                    color: "#d4d4d4",
                    stepSize: 5
                },
                grid: {
                    color: "#404040"
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

function tallyScores(chartData) {
    //           F/D/C, A, AA, AAA, S, SS, SSS
    let data = [  0  , 0,  0,  0 , 0,  0,  0 ];

    //             B, A+, AA+, AAA+, S+, SS+, SSS+
    let data_p = [  0,  0,  0 ,   0 ,  0,  0 ,   0 ];

    if (chartData && !("scores" in chartData)) {
        return {data: data, data_p: data_p};
    }

    for (const score of chartData.scores) {
        switch (score.grade) {
            case 'f':      data[0]   += 1; break;
            case 'd':      data[0]   += 1; break;
            case 'c':      data[0]   += 1; break;
            case 'b':      data_p[0] += 1; break;
            case 'a':      data[1]   += 1; break;
            case 'a_p':    data_p[1] += 1; break;
            case 'aa':     data[2]   += 1; break;
            case 'aa_p':   data_p[2] += 1; break;
            case 'aaa':    data[3]   += 1; break;
            case 'aaa_p':  data_p[3] += 1; break;
            case 's':      data[4]   += 1; break;
            case 's_p':    data_p[4] += 1; break;
            case 'ss':     data[5]   += 1; break;
            case 'ss_p':   data_p[5] += 1; break;
            case 'sss':    data[6]   += 1; break;
            case 'sss_p':  data_p[6] += 1; break;
            default: break;
        }
    }
    return {data: data, data_p: data_p};
}

function BarChart({ innerRef, chartData, title, subtitle }) {
    const {data, data_p} = tallyScores(chartData);

    // round up to nearest 5
    let maxCount = Math.max(...[Math.max(...data), Math.max(...data_p)]);
    maxCount = maxCount % 5 === 0 ? maxCount += 1 : maxCount;
    const yAxisHeight = Math.ceil(maxCount/5)*5;

    const chartOptions = setupChartOptions(title, subtitle, yAxisHeight);
    const plugins = setupChartPlugins();
    const tempData={
        labels: labels,
        datasets: [{
            // F/D/C, A, AA, AAA, S, SS, SSS
            data: data,
            label: "Count",
            type: "bar",
            yAxisID: "y",
            backgroundColor: backgroundColors
        }, {
            // B, A+, AA+, AAA+, S+, SS+, SSS+
            data: data_p,
            label: "Count",
            type: "bar",
            yAxisID: "y",
            backgroundColor: backgroundColors,
        }]
    }

    return ( 
      <Bar ref={innerRef}
        data={tempData}
        options={chartOptions}
        plugins={plugins}
      />
    )
}

export default BarChart;
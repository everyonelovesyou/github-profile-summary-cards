import {Card} from './card';
import * as d3 from 'd3';
import moment from 'moment';
import {Theme} from '../const/theme';

export function createDetailCard(
    title: string,
    userDetails: {
        index: number;
        icon: string;
        name: string;
        value: string;
    }[],
    contributionsData: {contributionCount: number; date: Date}[],
    theme: Theme
) {
    const card = new Card(title, 700, 200, theme);
    const svg = card.getSVG();

    // draw icon
    const panel = svg.append('g').attr('transform', `translate(30,30)`);
    const labelHeight = 14;
    panel
        .selectAll(null)
        .data(userDetails)
        .enter()
        .append('g')
        .attr('transform', d => {
            const y = labelHeight * d.index * 2;
            return `translate(0,${y})`;
        })
        .attr('width', labelHeight)
        .attr('height', labelHeight)
        .attr('fill', theme.icon)
        .html(d => d.icon);

    // draw text
    panel
        .selectAll(null)
        .data(userDetails)
        .enter()
        .append('text')
        .text(d => {
            return d.value;
        })
        .attr('x', labelHeight * 1.5)
        .attr('y', d => labelHeight * d.index * 2 + labelHeight)
        .style('fill', theme.text)
        .style('font-size', `${labelHeight}px`);

    // process chart data
    const lineChartData: {contributionCount: number; date: Date}[] = [];
    for (const data of contributionsData) {
        const formatDate = moment(data.date).format('YYYY-MM');
        data.date = new Date(formatDate);
        const lastIndex = lineChartData.length - 1;
        if (lineChartData.length == 0 || lineChartData[lastIndex].date.getTime() !== data.date.getTime()) {
            lineChartData.push({
                contributionCount: data.contributionCount,
                date: data.date
            }); // use new object
        } else {
            lineChartData[lastIndex].contributionCount += data.contributionCount;
        }
    }

    // prepare chart data
    const chartRightMargin = 30;
    const chartWidth = card.width - 2 * card.xPadding - chartRightMargin - 230;
    const chartHeight = card.height - 2 * card.yPadding - 10;
    const x = d3.scaleTime().range([0, chartWidth]);

    x.domain(
        <[Date, Date]>d3.extent(lineChartData, function (d) {
            return d.date;
        })
    );

    // eslint-disable-next-line prefer-spread
    const yMax = Math.max.apply(
        Math,
        lineChartData.map(function (o) {
            return o.contributionCount;
        })
    );

    const y = d3.scaleLinear().range([chartHeight, 0]);
    y.domain([0, yMax]);
    y.nice();

    const valueline = d3
        .area<{contributionCount: number; date: Date}>()
        .x(function (d) {
            return x(d.date);
        })
        .y0(y(0))
        .y1(function (d) {
            return y(d.contributionCount);
        })
        .curve(d3.curveMonotoneX);

    const chartPanel = svg
        .append('g')
        .attr('color', theme.chart)
        .attr('transform', `translate(${card.width - chartWidth - card.xPadding + 5},10)`);

    // draw chart line
    chartPanel
        .append('path')
        .data([lineChartData])
        .attr('transform', `translate(${-chartRightMargin},0)`)
        .attr('stroke', theme.chart)
        .attr('fill', theme.chart)
        .attr('opacity', 1)
        .attr('d', valueline);

    // Add the X Axis
    const xAxis = d3
        .axisBottom<Date>(x)
        .tickFormat(d3.timeFormat('%y/%m'))
        .tickValues(
            lineChartData
                .filter((_, i) => {
                    return i % 2 === 0;
                })
                .map(d => {
                    return d.date;
                })
        );

    chartPanel
        .append('g')
        .attr('color', theme.title)
        .attr('transform', `translate(${-chartRightMargin},${chartHeight})`)
        .call(xAxis)
        .selectAll('text')
        .attr('fill', theme.text);

    // Add the Y Axis
    chartPanel
        .append('g')
        .attr('color', theme.title)
        .attr('transform', `translate(${chartWidth - chartRightMargin},0)`)
        .call(d3.axisRight(y).ticks(8))
        .selectAll('text')
        .attr('fill', theme.text);

    // hard code this coordinate becuz I'm too lazy
    chartPanel
        .append('g')
        .append('text')
        .text('contributions in the last year')
        .attr('y', title.length > 30 ? 140 : -15) // if the title is too long, then put text to the bottom
        .attr('x', 230)
        .style('fill', theme.text)
        .style('font-size', `10px`);

    return card.toString();
}

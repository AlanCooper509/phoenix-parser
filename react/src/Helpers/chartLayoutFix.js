import Chart from 'chart.js/auto';

// Chart.js sizes a chart from its container's getBoundingClientRect(), which includes CSS
// transforms. UserPage shrinks the whole page with transform: scale() on narrow screens,
// so a chart could be sized to the already-shrunken width and then shrunk again (tiny
// chart until something forced another resize). This re-measures with layout sizes
// (clientWidth/clientHeight ignore transforms) whenever Chart.js sizes a chart.

function layoutSize(chart) {
    const container = chart.canvas.parentNode;
    if (!container || container.clientWidth === 0) {
        return null;  // detached or hidden (e.g. inactive tab)
    }
    const style = getComputedStyle(container);
    const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const width = container.clientWidth - padX;
    const height = chart.options.maintainAspectRatio
        ? width / (chart.options.aspectRatio || 2)
        : container.clientHeight - padY;
    return { width, height };
}

function fitToLayout(chart) {
    const size = layoutSize(chart);
    if (size && (Math.abs(chart.width - size.width) > 1 || Math.abs(chart.height - size.height) > 1)) {
        // explicit sizes skip Chart.js's transform-affected measurement
        chart.resize(size.width, size.height);
    }
}

Chart.register({
    id: 'layoutSizeFix',
    afterInit: fitToLayout,
    resize: fitToLayout,
});

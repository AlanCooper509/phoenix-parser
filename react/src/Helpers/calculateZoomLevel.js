function calculateZoomLevel(minScreenWidth) {
    const screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    const zoomLevel = screenWidth < minScreenWidth ? (screenWidth / minScreenWidth) : 1.00;
    return zoomLevel;
};

export default calculateZoomLevel;
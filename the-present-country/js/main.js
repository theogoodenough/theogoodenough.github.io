// Deep-zoom map viewer. OpenSeadragon draws the tile pyramid in map.dzi,
// fetching only the tiles in view at the current zoom.
(function () {
  const $ = id => document.getElementById(id);
  const phone = matchMedia('(max-width: 560px)').matches;
  const viewer = OpenSeadragon({
    element: $('map'),
    tileSources: 'map.dzi',
    showNavigationControl: false,           // our own buttons in the bar
    showNavigator: !phone,
    navigatorPosition: 'BOTTOM_RIGHT',
    navigatorSizeRatio: 0.16,
    navigatorAutoFade: false,
    visibilityRatio: 0.6,                   // the sheet can't be lost off screen
    constrainDuringPan: true,
    minZoomImageRatio: 0.8,
    maxZoomPixelRatio: 1.25,                // just past one map pixel per screen pixel
    zoomPerScroll: 1.25,
    animationTime: 0.5,
    springStiffness: 9,
    immediateRender: false,
    blendTime: 0.15,
    preserveImageSizeOnResize: true,
    viewportMargins: phone ? { top: 56, bottom: 8, left: 8, right: 8 } : { top: 72, bottom: 16, left: 16, right: 16 },
    gestureSettingsMouse: { clickToZoom: false, dblClickToZoom: true },
    gestureSettingsTouch: { pinchRotate: false, dblClickToZoom: true },
    crossOriginPolicy: false,
  });

  $('zoom-in').onclick = () => viewer.viewport.zoomBy(1.6).applyConstraints();
  $('zoom-out').onclick = () => viewer.viewport.zoomBy(1 / 1.6).applyConstraints();
  $('home').onclick = () => viewer.viewport.goHome();

  const root = document.documentElement;
  if (root.requestFullscreen) {
    $('full').hidden = false;
    $('full').onclick = () => document.fullscreenElement ? document.exitFullscreen() : root.requestFullscreen();
  }

  // Keyboard: arrows pan, +/- zoom, 0 whole map (OpenSeadragon handles w/a/s/d and arrows once focused).
  viewer.addHandler('open', () => viewer.canvas.focus());
  document.addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('#bar')) return;
    if (e.key === '0') viewer.viewport.goHome();
  });

  // The hint goes once the reader has moved the map, or after a while.
  const hint = $('hint');
  const hide = () => hint.classList.add('gone');
  viewer.addOnceHandler('canvas-drag', hide);
  viewer.addOnceHandler('canvas-scroll', hide);
  viewer.addOnceHandler('canvas-pinch', hide);
  setTimeout(hide, 9000);
})();

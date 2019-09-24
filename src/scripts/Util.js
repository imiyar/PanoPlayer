// Helper functions

function normalizeWheel(event) {
  let sY = 0;
  if ('detail' in event) { sY = event.detail; }
  if ('wheelDelta' in event) { sY = -event.wheelDelta / 100; }
  if ('wheelDeltaY' in event) { sY = -event.wheelDeltaY / 100; }

  // side scrolling on FF with DOMMouseScroll
  if ('axis' in event && event.axis === event.HORIZONTAL_AXIS) { sY = 0; }

  return sY;
}

function getMousePos(event) {
  const clientX = event.clientX || (event.touches && event.touches[0].clientX);
  const clientY = event.clientY || (event.touches && event.touches[0].clientY);
  return [clientX, clientY];
}

function getTouchesDistance(touches) {
  return Math.sqrt(((touches[0].clientX - touches[1].clientX) ** 2) + ((touches[0].clientY - touches[1].clientY) ** 2));
}

function getCameraTargetPos(lat, lon, radius) {
  // Degree to Radians
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = lon * (Math.PI / 180);
  return [
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

function getNextNum(current, target, step) {
  const absStep = Math.abs(step);
  return Math.abs(current - target) < absStep ? target : current + absStep * (current < target ? 1 : -1);
}

function deepCopy(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  const copy = Array.isArray(obj) ? [] : {};
  Object.keys(obj).forEach((key) => {
    copy[key] = deepCopy(obj[key]);
  });

  return copy;
}

function clamp(value, min, max) {
  if (typeof value !== 'number') {
    throw (new Error('Camera position value is not a number.'));
  }
  return Math.max(min, Math.min(max, value));
}

export {
  normalizeWheel,
  getMousePos,
  getTouchesDistance,
  getCameraTargetPos,
  getNextNum,
  deepCopy,
  clamp,
};

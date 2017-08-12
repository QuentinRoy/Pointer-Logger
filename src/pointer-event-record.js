const EVENT_MAP = {
  mousedown: { type: 'start', device: 'mouse' },
  mouseup: { type: 'end', device: 'mouse' },
  mouseout: { type: 'out', device: 'mouse' },
  mouseover: { type: 'in', device: 'mouse' },
  mousemove: { type: 'move', device: 'mouse' },
  touchstart: { type: 'start', device: 'touch' },
  touchmove: { type: 'move', device: 'touch' },
  touchend: { type: 'end', device: 'touch' },
  touchcancel: { type: 'end', device: 'touch' }
};

const map = (context, ...args) => Array.prototype.map.apply(context, args);

// Get the mean value of a list of number
const mean = list =>
  Array.prototype.reduce.call(list, (sum, x) => sum + x, 0) / list.length;

const getPointerEventXY = (evt, device, type) => {
  if (device === 'mouse') {
    return {
      x: evt.clientX,
      y: evt.clientY
    };
  } else if (device === 'touch') {
    return type === 'end'
      ? null
      : {
        x: mean(map(evt.touches, t => t.clientX)),
        y: mean(map(evt.touches, t => t.clientY))
      };
  }
  throw new Error(`Cannot get location for event from unsupported device "${device}"`);
};

const getPointerEventActive = (evt, device, type, wasActive) =>
  (device === 'touch' && evt.touches.length > 0) ||
  (device === 'mouse' && (
    type === 'move' && wasActive
    || type === 'start'
  ));

const getPointerEventPointerCount = (evt, device, _, active) => {
  if (device === 'touch') {
    return evt.touches.length;
  }
  return active ? 1 : 0;
};

const createPointerEventRecord = (
  evt,
  wasActive,
  { left = 0, top = 0, height = 0 } = {}
) => {
  const { type, device } = EVENT_MAP[evt.type];
  const active = getPointerEventActive(evt, device, type, wasActive);
  const pos = getPointerEventXY(evt, device, type, active);
  return {
    type,
    x: pos ? pos.x - left : null,
    // Transform y origin to be at the bottom instead of the top.
    y: pos ? height - pos.y + top : null,
    active,
    device,
    pointerCount: getPointerEventPointerCount(evt, device, type, active),
    timeStamp: evt.timeStamp
  };
};

export default createPointerEventRecord;

const EVENT_MAP = {
  mousedown: { type: 'start', device: 'mouse' },
  mouseup: { type: 'end', device: 'mouse' },
  mouseout: { type: 'end', device: 'mouse' },
  mousemove: { type: 'move', device: 'mouse' },
  touchstart: { type: 'start', device: 'touch' },
  touchmove: { type: 'move', device: 'touch' },
  touchend: { type: 'end', device: 'touch' },
  touchcancel: { type: 'end', device: 'touch' }
};

const map = (context, ...args) =>
  Array.prototype.map.apply(context, args);

// Get the mean value of a list of number
const mean = list =>
  Array.prototype.reduce.call(list, (sum, x) => sum + x, 0) / list.length;

const getPointerEventXY = (evt, device, type) => {
  if (type === 'end') return null;
  return device === 'mouse' ? {
    x: evt.clientX,
    y: evt.clientY
  } : {
    x: mean(map(evt.touches, t => t.clientX)),
    y: mean(map(evt.touches, t => t.clientY))
  };
};

const getPointerEventPointerCount = (evt, device) => {
  if (device === 'touch') {
    return evt.touches.length;
  }
  return 1;
};

const createPointerEventRecord = (
  evt,
  { left = 0, top = 0, height = 0 } = {}
) => {
  const { type, device } = EVENT_MAP[evt.type];
  const pos = getPointerEventXY(evt, device, type);
  return {
    type,
    x: pos ? pos.x - left : null,
    // Transform y origin to be at the bottom instead of the top.
    y: pos ? height - pos.y + top : null,
    // active,
    device,
    pointerCount: getPointerEventPointerCount(evt, device),
    timeStamp: evt.timeStamp
  };
};

export default createPointerEventRecord;

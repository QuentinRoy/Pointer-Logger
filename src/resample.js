import zip from 'lodash/zip';
import last from 'lodash/last';
import first from 'lodash/first';
import range from 'lodash/range';

/**
 * @typedef Record
 * @property {number} timeStamp - The time of the record.
 * @property {number} [x] - The x coordinate.
 * @property {number} [y] - The y coordinate.
 * @property {('start'|'end'|'in'|'out'|'move')} type - The type of record.
 * @property {boolean} active - If the record correspond to an active movement (e.g. the mouse
 * drag with the mouse button down).
 */

/**
 * A segment delimited by two records.
 * @typedef Segment
 * @property {Record} start
 * @property {Record} end
 * @property {number[]} [timeStamps] - The expected time stamps that happen during this segment.
 */

/**
 * Group the items of an array two by two with repetitions.
 * For example, segment([1, 2, 3]) -> [[1,2], [2,3]].
 *
 * @param {Array} movements The items to group.
 * @return {Array[]} The items grouped two by two.
 */
export const segment = movements =>
  zip(movements.slice(0, movements.length - 1), movements.slice(1));

/**
 * @param {Record[]} movements - A list of movement records.
 * @param {number} samplingRate - The rate of the sampling.
 * @return {Array<number>} The record timeStamps that are expected upon re-sampling of `movements`.
 */
export const resampleTimeStamps = (movements, samplingRate) =>
  range(
    Math.ceil(first(movements).timeStamp),
    last(movements).timeStamp + samplingRate,
    samplingRate
  );

/**
 * @param {Segment[]} segments - A list of segments.
 * @param {number} timeStamps - The expected record timeStamps.
 * @return {Segment[]} A new list of new segments with the timeStamps set up.
 */
export const mapSegmentTimeStamps = (segments, timeStamps) => {
  let i = 0;
  return segments.map(seg => {
    const segTimeStamps = [];
    for (; i < timeStamps.length; i += 1) {
      const t = timeStamps[i];
      if (t >= seg.end.timeStamp) break;
      if (t >= seg.start.timeStamp) segTimeStamps.push(t);
    }
    return Object.assign({}, seg, { timeStamps: segTimeStamps });
  });
};

/**
 * @param {number} pointTimeStamp T- he timeStamp of a point.
 * @param {Record} start - The start of the segment.
 * @param {Record} end - The end of the segment.
 * @return {{ x: number, y:number }} The coordinates of the point on the segment at
 * `pointTimeStamp`.
 */
export const interpolatePointOnSegment = (pointTimeStamp, start, end) => {
  const pointRelativePosition =
    (pointTimeStamp - start.timeStamp) / (end.timeStamp - start.timeStamp);
  return {
    x: (end.x - start.x) * pointRelativePosition + start.x,
    y: (end.y - start.y) * pointRelativePosition + start.y
  };
};

/**
 * Some record might be missed. Usually the can be ignored. However, in some cases, they might
 * be more meaningful than the following one. In this case, though we preserve the next record's
 * position, we make sure we forward the type.
 *
 * @param {Record} missed - The record that has been missed.
 * @param {Record} next - The following record.
 * @return {Record} A new record that should take the place of `next`.
 */
const forwardMissedRecord = (missed, next) => {
  if (next.type === 'move') {
    return Object.assign({}, next, {
      type: missed.type
    });
  }
  return next;
};

/**
 * Make sure the information of a missed segment gets carried away to the next.
 *
 * @param {Segment} missed - The missed segment.
 * @param {Segment} next - The following segment.ß
 * @return {Segment} The new segment.
 */
const forwardMissedSegment = (missed, next) =>
  Object.assign({}, next, {
    // Theoretically, missed.end is supposed to be next.start.
    start: forwardMissedRecord(missed.start, next.start)
  });

/**
 * @param {Segment} segment - The segment to resample.
 * @return {Record[]} The list of record corresponding to the resampled segment.
 */
export const resampleSegment = ({
  start: segStart,
  end,
  timeStamps,
  index
}) => {
  const start = segStart;
  const out = start.pointerCount === 0;
  return timeStamps.map((t, i) => {
    // Calculate the position of the record.
    let position;
    // If we are not out the position is interpolated.
    if (!out) position = interpolatePointOnSegment(t, start, end);
    // If we are out and this is the first record of the segment, copy the position from the start
    // of the segment (no interpolation).
    else if (i === 0) position = { x: start.x, y: start.y };
    // Otherwise, there is not position when the pointer is out.
    else position = { x: null, y: null };

    // Infer its type.
    let type;
    // The first record of a segment always copy the type of the segment.
    if (i === 0) type = start.type;
    // If we are out the type is out.
    else if (out) type = 'out';
    // All other records are move.
    else type = 'move';

    // Create and return the record.
    return Object.assign({}, start, position, {
      type,
      timeStamp: t,
      resampledSegmentIndex: index
    });
  });
};

/**
 * Resample movement records.
 * @param {Record[]} movements - A list of records.
 * @param {number} samplingRate - The expected sampling rate.
 * @return {Record[]} The resampled records.
 */
export default (movements, samplingRate) => {
  if (movements.length < 2 || !samplingRate) return movements.slice();
  // Create the list of the timeStamps associated with the new record to create.
  const timeStamps = resampleTimeStamps(movements, samplingRate);
  // Create a list of segments from the movement records
  const segments = segment(movements).map(([start, end], i) => ({
    start,
    end,
    index: i + 1
  }));
  return (
    // Create a list of segments from the movement records associated with the new timeStamps
    // They should have.
    mapSegmentTimeStamps(segments, timeStamps)
      // Forward the empty segments to make sure we do not miss an important event.
      .reduce((acc, seg) => {
        const prev = last(acc);
        return prev && prev.timeStamps.length === 0
          ? [...acc.slice(0, acc.length - 1), forwardMissedSegment(prev, seg)]
          : [...acc, seg];
      }, [])
      // Resample each segments.
      .map(resampleSegment)
      // Concat all.
      .reduce((acc, records) => [...acc, ...records])
      // The last record is not part of any segment, so we add it now.
      .concat([
        Object.assign({}, last(segments).end, { timeStamp: last(timeStamps) })
      ])
  );
};

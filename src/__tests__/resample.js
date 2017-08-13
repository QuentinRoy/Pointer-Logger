import test from 'ava';
import {
  segment,
  resampleTimeStamps,
  mapSegmentTimeStamps,
  interpolatePointOnSegment
} from '../resample';

test('`segments`', t => {
  t.deepEqual(segment([1, 2, 3, 4]), [[1, 2], [2, 3], [3, 4]]);
  t.deepEqual(segment([1]), []);
});

test('`resampledTimeStamps`', t => {
  t.deepEqual(
    resampleTimeStamps([{ timeStamp: 2001 }, { timeStamp: 2210 }], 50),
    [2001, 2051, 2101, 2151, 2201, 2251]
  );
  t.deepEqual(
    resampleTimeStamps([{ timeStamp: 2001 }, { timeStamp: 2251 }], 50),
    [2001, 2051, 2101, 2151, 2201, 2251]
  );
});

test('`mapSegmentTimeStamps`', t => {
  t.deepEqual(
    mapSegmentTimeStamps(
      [
        { start: { timeStamp: 5 }, end: { timeStamp: 10 } },
        { start: { timeStamp: 10 }, end: { timeStamp: 30 } },
        { start: { timeStamp: 32 }, end: { timeStamp: 33 } },
        { start: { timeStamp: 34 }, end: { timeStamp: 99 } },
        { start: { timeStamp: 99 }, end: { timeStamp: 120 } }
      ],
      [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 90, 95, 100, 110, 120, 140]
    ),
    [
      {
        start: { timeStamp: 5 },
        end: { timeStamp: 10 },
        timeStamps: [5]
      },
      {
        start: { timeStamp: 10 },
        end: { timeStamp: 30 },
        timeStamps: [10, 15, 20, 25]
      },
      {
        start: { timeStamp: 32 },
        end: { timeStamp: 33 },
        timeStamps: []
      },
      {
        start: { timeStamp: 34 },
        end: { timeStamp: 99 },
        timeStamps: [35, 40, 45, 50, 90, 95]
      },
      {
        start: { timeStamp: 99 },
        end: { timeStamp: 120 },
        timeStamps: [100, 110]
      }
    ]
  );
});

test('`interpolatePointOnSegment`', t => {
  t.deepEqual(
    interpolatePointOnSegment(
      20,
      { timeStamp: 10, x: 10, y: 10 },
      { timeStamp: 30, x: 20, y: 0 }
    ),
    { x: 15, y: 5 }
  );
  t.deepEqual(
    interpolatePointOnSegment(
      15,
      { timeStamp: 10, x: 10, y: 10 },
      { timeStamp: 30, x: 20, y: 0 }
    ),
    { x: 12.5, y: 7.5 }
  );
  t.deepEqual(
    interpolatePointOnSegment(
      8,
      { timeStamp: 8, x: 12, y: 11 },
      { timeStamp: 100, x: 200, y: 93 }
    ),
    { x: 12, y: 11 }
  );
  t.deepEqual(
    interpolatePointOnSegment(
      86,
      { timeStamp: 8, x: 12, y: 11 },
      { timeStamp: 86, x: 200, y: 93 }
    ),
    { x: 200, y: 93 }
  );
});

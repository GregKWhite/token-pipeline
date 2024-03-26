import {source} from '../pipe';
import {mapValues, mapItems} from '../helpers';

describe('helpers', () => {
  describe('mapValues', () => {
    it('returns a function that maps the values of an object', async () => {
      const result = await source({a: {value: 1}, b: {value: 2}, c: {value: 3}})
        .pipe(
          mapValues((num, key, collection) => ({
            times2: num.value * 2,
            originalKey: key,
            collection,
          }))
        )
        .flow();

      expect(result).toEqual({
        a: {
          times2: 2,
          originalKey: 'a',
          collection: {a: {value: 1}, b: {value: 2}, c: {value: 3}},
        },
        b: {
          times2: 4,
          originalKey: 'b',
          collection: {a: {value: 1}, b: {value: 2}, c: {value: 3}},
        },
        c: {
          times2: 6,
          originalKey: 'c',
          collection: {a: {value: 1}, b: {value: 2}, c: {value: 3}},
        },
      });
    });
  });

  describe('mapItems', () => {
    it('returns a function that maps the items of an array', async () => {
      const result = await source([1, 2, 3])
        .pipe(
          mapItems((num, index, collection) => ({
            times2: num * 2,
            originalIndex: index,
            collection,
          }))
        )
        .flow();

      expect(result).toEqual([
        {times2: 2, originalIndex: 0, collection: [1, 2, 3]},
        {times2: 4, originalIndex: 1, collection: [1, 2, 3]},
        {times2: 6, originalIndex: 2, collection: [1, 2, 3]},
      ]);
    });
  });
});

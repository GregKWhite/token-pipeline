import {source} from '../pipe';
import {mapValues, mapItems} from '../helpers';

describe('helpers', () => {
  describe('mapValues', () => {
    it('returns a function that maps the values of an object', async () => {
      const result = await source({a: {value: 1}, b: {value: 2}, c: {value: 3}})
        .pipe(
          mapValues((num, key) => ({times2: num.value * 2, originalKey: key}))
        )
        .flow();

      expect(result).toEqual({
        a: {times2: 2, originalKey: 'a'},
        b: {times2: 4, originalKey: 'b'},
        c: {times2: 6, originalKey: 'c'},
      });
    });
  });

  describe('mapItems', () => {
    it('returns a function that maps the items of an array', async () => {
      const result = await source([1, 2, 3])
        .pipe(
          mapItems((num, index) => ({times2: num * 2, originalIndex: index}))
        )
        .flow();

      expect(result).toEqual([
        {times2: 2, originalIndex: 0},
        {times2: 4, originalIndex: 1},
        {times2: 6, originalIndex: 2},
      ]);
    });
  });
});

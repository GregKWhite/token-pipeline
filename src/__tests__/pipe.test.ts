import {source} from '../pipe';
import mockfs from 'mock-fs';
import {promises as fs} from 'fs';

describe('pipelines', () => {
  describe('.flow', () => {
    test('it evaluates the callbacks in order', async () => {
      const result = await source([1, 2, 3])
        .pipe((array) => array.map((item) => item * 2))
        .pipe((array) => Object.fromEntries(array.map((i) => [i, i ** 2])))
        .flow();

      expect(result).toEqual({2: 4, 4: 16, 6: 36});
    });

    test('it supports having no callbacks', async () => {
      const result = await source([1, 2, 3]).flow();
      expect(result).toEqual([1, 2, 3]);
    });

    test('supports creating base pipelines', async () => {
      function createPipe(x: number) {
        return source(x)
          .pipe((x) => x * 2)
          .pipe((x) => x + 1);
      }

      expect(await createPipe(2).flow()).toEqual(5);
      expect(
        await createPipe(3)
          .pipe((x) => x + 3)
          .flow()
      ).toEqual(10);
    });

    test('it does not call any of the callbacks until flow is called', async () => {
      const mock = jest.fn();

      const pipeline = source([1, 2, 3])
        .tap(mock)
        .pipe((array) => {
          mock(array);
          return array;
        });

      expect(mock).not.toHaveBeenCalled();
      await pipeline.flow();
      expect(mock).toHaveBeenCalledTimes(2);
    });
  });

  describe('.tap', () => {
    test('it calls the callback with the current value', async () => {
      const mock = jest.fn();
      const mock2 = jest.fn();

      await source([1, 2, 3])
        .pipe((array) => array.map((x) => x * 2))
        .tap(mock)
        .pipe((array) => array.map((x) => x + 1))
        .tap(mock2)
        .flow();

      expect(mock).toHaveBeenCalledWith([2, 4, 6]);
      expect(mock2).toHaveBeenCalledWith([3, 5, 7]);
    });
  });

  describe('.pipe', () => {
    test('it passes the previous value into the callback and returns the result', async () => {
      const result = await source([1, 2, 3])
        .pipe((array) => array.map((x) => x * 2))
        .pipe((array) => array.map((x) => x + 1))
        .flow();

      expect(result).toEqual([3, 5, 7]);
    });
  });

  describe('.join', () => {
    test('it joins the values of the pipeline together', async () => {
      const result = await source([1, 2, 3])
        .pipe((array) => array.map((x) => x + 1))
        .join(['a', 'b', 'c'])
        .pipe((values) => {
          return {someKey: values};
        })
        .flow();

      expect(result).toEqual({
        someKey: [
          [2, 3, 4],
          ['a', 'b', 'c'],
        ],
      });
    });
  });

  describe('.out', () => {
    beforeEach(() => {
      mockfs({});
    });

    afterEach(() => {
      mockfs.restore();
    });

    test('it writes the value to the file', async () => {
      await source([1, 2, 3])
        .pipe((array) => array.map((x) => x + 1))
        .out('test.json', (value) => JSON.stringify(value))
        .flow();

      expect(await fs.readFile('test.json', 'utf8')).toEqual('[2,3,4]');
    });

    test('it supports formatter functions', async () => {
      async function formatter(filePath: string) {
        const contents = await fs.readFile(filePath, 'utf8');

        fs.writeFile(filePath, contents.replace(/2/g, '"two"'));
      }

      await source([1, 2, 3])
        .pipe((array) => array.map((x) => x + 1))
        .out('test.json', JSON.stringify, {formatter})
        .flow();

      expect(await fs.readFile('test.json', 'utf8')).toEqual('["two",3,4]');
    });
  });
});

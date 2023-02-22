import {promises as fs} from 'fs';

type PromiseOrValue<T> = T | Promise<T>;
type PipelinePromise = (arg: any) => PromiseOrValue<any>;

/**
 * A pipeline is a lazily evaluated chain of typed callback functions that are
 * executed in order. You **must** call `flow` on the pipeline in order to
 * execute it.
 */
type Pipeline<T> = {
  /**
   * Execute a callback with the current value of the pipeline and return a new value.
   * @example
   * source([1, 2, 3])
   *   .pipe((nums) => nums.map((num) => num * 2)) // [2, 4, 6]
   *   .pipe((nums) => nums.reduce((sum, num) => sum + num, 0)) // 12
   *   .pipe((sum) => sum.toString()) // '12'
   *   .flow() // '12'
   * @param callback A function that receives the current pipeline value and returns a new value
   * @returns The pipeline with the new value
   */
  pipe: <R>(
    callback: (args: T) => NonNullable<PromiseOrValue<R>>
  ) => Pipeline<R>;

  /**
   * Execute a callback with the current value of the pipeline and return that value.
   * @example
   * source([1, 2, 3])
   *   .tap((nums) => console.log(nums)) // [1, 2, 3]
   *   .flow() // [1, 2, 3]
   * @param callback A function that receives the current pipeline value and returns void
   */
  tap: (callback: (args: T) => PromiseOrValue<void>) => Pipeline<T>;

  /**
   * Join the current value of the pipeline with other values.
   * @example
   * source([1, 2, 3])
   *   .join(['a', 'b', 'c'], 'someKey')
   *   .pipe(([nums, letters, key]) => { [key]: Object.fromEntries(zip(nums, letters)) })
   *   .flow() // { someKey: {1: 'a', 2: 'b', 3: 'c'} }
   * @param joinedValue The values to join with the current value of the pipeline
   * @returns The pipeline with the joined values tuple
   */
  join: <T2 extends any[]>(...joinedValue: [...T2]) => Pipeline<[T, ...T2]>;

  /**
   * Write contents to a file using the current value of the pipeline
   * @example
   * source('Hello World')
   *  .out('hello.txt', (content) => content)
   *  .flow() // Outputs 'Hello World' to hello.txt
   * @param filepath The filepath to write to
   * @param callback A function that receives the current pipeline value and returns a string to write to the file
   * @param options.formatter A function that receives the filepath and formats the file. It should write the formatted file to the same filepath.
   * @returns The pipeline with the previous value
   */
  out: (
    filepath: string,
    callback: (args: T) => PromiseOrValue<string>,
    options?: {formatter?: (filepath: string) => PromiseOrValue<void>}
  ) => Pipeline<T>;

  /**
   * Execute the pipeline and return the last value
   * @returns The last value of the pipeline
   */
  flow: () => Promise<T>;
};

function makePipeline<T>(promises: PipelinePromise[]): Pipeline<T> {
  return {
    pipe: function <R>(
      callback: (args: T) => NonNullable<PromiseOrValue<R>>
    ): Pipeline<R> {
      return makePipeline<R>([...promises, callback]);
    },
    tap: function (callback) {
      return makePipeline<T>([
        ...promises,
        async (prev) => {
          await callback(prev);
          return prev;
        },
      ]);
    },
    join: function <T2 extends any[]>(...joinedValue: [...T2]) {
      return makePipeline<[T, ...T2]>([
        ...promises,
        (prev) => [prev, ...joinedValue],
      ]);
    },
    out: function (filepath: string, callback, {formatter} = {}) {
      return makePipeline<T>([
        ...promises,
        async (prev) => {
          await fs.writeFile(filepath, await callback(prev));
          if (formatter) await formatter(filepath);

          console.log(`✓ ${filepath}`);

          return prev;
        },
      ]);
    },
    flow: async function () {
      let value: any = undefined;
      for (const promise of promises) {
        value = await promise(value);
      }
      return value as T;
    },
  };
}

/**
 * Creates a pipeline with a starting value. The pipeline is a lazily evaluated
 * chain of typed callback functions that are executed in order. You **must**
 * call `flow` on the pipeline in order to execute it.
 * @example
 * source([1, 2, 3])
 *   .pipe((nums) => nums.map((num) => num * 2)) // [2, 4, 6]
 *   .tap((nums) => console.log(nums)) // logs [2, 4, 6]
 *   .out('nums.txt', (nums) => nums.join(',')) // Writes '2,4,6' to nums.txt
 *   .flow() // Evaluates the pipeline and returns [2, 4, 6]
 * @param value The value to start the pipeline with
 * @returns A pipeline with the starting value
 */
export function source<T>(value: T) {
  return makePipeline<T>([() => value]);
}

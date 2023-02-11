import {promises as fs} from 'fs';

type PromiseOrValue<T> = T | Promise<T>;
type PipelinePromise = (arg: any) => PromiseOrValue<any>;

type Pipeline<T> = {
  pipe: <R>(
    callback: (args: T) => NonNullable<PromiseOrValue<R>>
  ) => Pipeline<R>;
  tap: (callback: (args: T) => PromiseOrValue<void>) => Pipeline<T>;
  join: <T2 extends any[]>(...joinedValue: [...T2]) => Pipeline<[T, ...T2]>;
  out: (
    filepath: string,
    options: {formatter?: (filepath: string) => PromiseOrValue<void>},
    callback: (args: T) => PromiseOrValue<string>
  ) => Pipeline<T>;
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
    out: function (filepath: string, {formatter}, callback) {
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

export function source<T>(value: T) {
  const promises: ((arg: any) => PromiseOrValue<any>)[] = [() => value];
  return makePipeline<T>(promises);
}

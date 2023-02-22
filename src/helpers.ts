import {Union} from 'ts-toolbelt';

/**
 * A helper function for pipelines that returns a function that maps an array of items.
 * @example
 * source([1, 2, 3])
 *   .pipe(mapItems((num) => num * 2))
 *   .flow() // [2, 4, 6]
 * @param callback The function that maps each item in the array.
 * @returns A function that maps an array of items using the given callback.
 */
export function mapItems<T, R>(callback: (arg: T) => R): (arg: T[]) => R[] {
  return (data) => data.map(callback);
}

/**
 * A helper function for pipelines that returns a function that maps the values of an object.
 * @example
 * source({a: 1, b: 2, c: 3})
 *   .pipe(mapValues((num) => num * 2))
 *   .flow() // {a: 2, b: 4, c: 6}
 * @param callback The function that maps each value in the object.
 * @returns A function that maps the values of an object using the given callback.
 */
export function mapValues<T extends Record<any, any>, R>(
  callback: (arg: Union.Merge<T[keyof T]>) => R
) {
  return (data: T) => {
    return Object.keys(data).reduce((acc, key) => {
      return {
        ...acc,
        [key]: callback(data[key]),
      };
    }, {} as {[key in keyof T]: R});
  };
}

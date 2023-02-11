import {Union} from 'ts-toolbelt';

export function mapItems<T, R>(callback: (arg: T) => R): (arg: T[]) => R[] {
  return (data) => data.map(callback);
}

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

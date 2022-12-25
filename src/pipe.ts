import { List } from "ts-toolbelt";

export function pipe<T, F extends Fn[]>(value: T, ...fns: Reducers<T, F>) {
  return fns.reduce((acc, fn) => fn(acc), value) as ReturnType<List.Last<F>>;
}

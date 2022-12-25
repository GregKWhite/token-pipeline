type Fn = (arg: any) => any;
type Tail<T extends any[]> = T extends [any, ...infer Rest]
  ? Rest extends Fn[] ? Rest : never
  : never;

type ValidateReducers<F extends Fn[]> =
  F['length'] extends 0 | 1
  ? true
  : CanMap<F[0], F[1]> extends true
  ? ValidateReducers<Tail<F>>
  : false;

type Reducers<T, F extends Fn[]> =
  T extends Parameters<F[0]>[0]
  ? ValidateReducers<F> extends true
    ? F
    : never
  : never;

type CanMap<A extends Fn, B extends Fn> = ReturnType<A> extends Parameters<B>[0] ? true : false;

type Last<T extends any[]> = T extends [...infer _, infer Last] ? Last : never;

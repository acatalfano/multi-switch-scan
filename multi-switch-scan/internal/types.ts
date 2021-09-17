//TODO: (the real TODO:) work up the type-utilities repo and then add to it to make whatever
//x                      more specific/non-generic types you need...... 











import type { Observable, of } from 'rxjs';

// //TODO: this might not be used at all...
// export type ObservableType<O> = O extends Observable<infer T> ? T : never;

export type AccumFn<R, T> =
    (acc: R, value: T, index?: number) => R;

export type SrcAccumPair<R, U> =
    [Observable<U>, AccumFn<R, U>];

export type IsSame<U, V> = (
    <T>() => (T extends U ? true : false)
) extends (
        <T>() => (T extends V ? true : false)
    ) ? true : false;

export type PairList<R, L extends unknown[] = unknown[]> =
    PairListHelper<R, L> extends SrcAccumPair<R, unknown>[] ?
    SrcAccumPair<R, unknown>[] : never;

// // export interface IndexMap<P extends unknown[]> {
// //     (): IndexMapHelper<P>;
// // }
export type IndexMap<P extends unknown[]> = IndexMapHelper<P>;

export type AccumMap<R, L extends PairList<R>> =
    SrcListFromSrcAccumListHelper<R, L> extends (infer S) ?
    S extends unknown[] ?
    AccumMapHelper<R, S> : never : never;

export type SrcInPair<R, T extends SrcAccumPair<R, unknown>> =
    T extends SrcAccumPair<R, infer U> ? U : never;

// //TODO: SrcUnion<R, P> is evaluated as:
// //x    SrcUnion<R, L extends AccumSrcPair<R, unknown>[]> ---->
// //x        L extends void | [] ? never : SrcUnionRecurser<R, L, never>
// // export interface SrcUnion<R, L extends AccumSrcPair<R, unknown>[]> {
// //     (): SrcUnionHelper<R, L>;
// // }
// export type SrcUnion<R, L extends SrcAccumPair<R, unknown>[]> = SrcUnionHelper<R, L>;

// type trysrcunion<R> = SrcUnion<R, PairList<R, [number, string]>>;
// type instant = trysrcunion<boolean>;

// //TODO: this one here vvv just always evals to never
export type ValueIndexPair<R, P extends PairList<R>, S extends SrcUnion<R, P>> = {
    [K in keyof IndexMap<P>]: SrcInPair<R, IndexMap<P>[K]> extends S ? {
        value: SrcInPair<R, IndexMap<P>[K]>,
        index: K
    } : never
}[keyof IndexMap<P>];

// //TODO: fix ValueIndexPair
// //TODO: kill the test type when done...
// //TODO: actually, SrcUnion is the problem ^^^^
// //ValueIndexPair<R, P extends AccumSrcPair<R, unknown>[], S extends SrcUnion<R, P>> = never;
// type TestValueIndexPair<R, P extends PairList<R>> = ValueIndexPair<R, P, SrcUnion<R, P>>;

export type SourceMapper<R, P extends PairList<R>, S extends SrcUnion<R, P>> =
    <I extends keyof IndexMap<P>>(
        // _value: IndexMap<P>[I] extends AccumSrcPair<R, infer U> ?
        //     IsSame<U, S> extends false ? U extends S ? AccumSrcPair<R, U> : never : never : never,
        _value: IndexMap<P>[I] extends SrcAccumPair<R, infer U> ?
            SrcAccumPair<R, U> : never,
        _index: I
    ) =>
        typeof _value extends SrcAccumPair<R, infer U> ?
        U extends S ?
        Observable<ValueIndexPair<R, P, U>> :
        never : never;

type Head<T extends unknown[]> =
    T extends [unknown, ...unknown[]] ?
    T[0] : never;

type Tail<T extends unknown[] | readonly unknown[]> =
    ((..._: T) => unknown) extends ((_: unknown, ...tail: infer TT) => unknown) ?
    TT : [];

type HasTail<T extends unknown[] | readonly unknown[]> =
    T extends ([] | [unknown]) ? false : true;

type Length<T extends unknown[] | readonly unknown[]> =
    T['length'];

type Prepend<S, T extends unknown[] | readonly unknown[]> =
    ((_: S, ...__: T) => unknown) extends ((..._: infer U) => unknown) ? U : T;

// //TODO: these vvv may not be necessary... (but might need it to guarantee the tuples coersion)

// type HeadReadonly<T extends readonly unknown[]> =
//     T extends readonly [unknown, ...unknown[]] ?
//     T[0] : never;

// type PrependReadonly<S, T extends readonly unknown[]> = Prepend<S, T>;

// type LengthReadonly<T extends readonly unknown[]> = Length<T>;

// type TailReadonly<T extends readonly unknown[]> = Tail<T>;

// type HasTailReadonly<T extends readonly unknown[]> = HasTail<T>;

// type PosReadonly<I extends readonly unknown[]> = Pos<I>;

// type NextReadonly<I extends readonly unknown[]> = Next<I>;

// type ReverseReadonly<
//     T extends readonly unknown[],
//     R extends readonly unknown[],
//     I extends readonly unknown[]
//     > = Reverse<T, R, I>;

// //type ConcatReadonly<S extends readonly unknown[], T extends readonly unknown[]> = Concat<S, T>;

// //type AppendReadonly<S, T extends readonly unknown[]> = Append<S, T>;

type Pos<I extends unknown[] | readonly unknown[]> = Length<I>;
type Next<I extends unknown[] | readonly unknown[]> = Prepend<unknown, I>;

interface ReverseRecurser<
    T extends unknown[] | readonly unknown[],
    R extends unknown[] | readonly unknown[],
    I extends unknown[] | readonly unknown[]
    > {
    (): Reverse<T, Prepend<T[Pos<I>], R>, Next<I>>
}

type Reverse<
    T extends unknown[] | readonly unknown[],
    R extends unknown[] | readonly unknown[] = [],
    I extends unknown[] | readonly unknown[] = []
    > = Pos<I> extends Length<T> ? R : ReverseRecurser<T, R, I>;

type Concat<S extends unknown[] | readonly unknown[], T extends unknown[] | readonly unknown[]> =
    Reverse<S> extends (infer U) ?
    U extends unknown[] ?
    Reverse<U, T> : never : never;

type Append<S, T extends unknown[] | readonly unknown[]> = Concat<T, [S]>;

// interface ReverseRecurserReadonly<
//     T extends readonly unknown[],
//     R extends readonly unknown[],
//     I extends readonly unknown[]
//     > {
//     (): ReverseReadonly<T,>;
// }

// type ReverseReadonly<
//     T extends readonly unknown[],
//     R extends readonly unknown[] = [],
//     I extends unknown[] = []
//     > =

//     type inspect3a = Append<number, [string]>;



// // Head<ArgsList> extends infer T ?
// //         PairListHelper<RType, Tail<ArgsList>, Append<AccumSrcPair<RType, T>, Result>> :
// //         never;


// //TODO: readonly unknown[]
interface PairListRecurser<
    RType,
    ArgsList extends unknown[],
    Result extends unknown[] = []
    > extends Array<SrcAccumPair<RType, unknown>> {
    (): PairListHelper<RType, Tail<ArgsList>, Append<SrcAccumPair<RType, Head<ArgsList>>, Result>>
}

type PairListHelper<
    RType,
    ArgsList extends unknown[],
    Result extends unknown[] = []
    > =
    ArgsList extends void | null | undefined ? Result : (
        HasTail<ArgsList> extends true ? PairListRecurser<RType, ArgsList, Result> :
        Append<SrcAccumPair<RType, Head<ArgsList>>, Result>
    );



// type pairlistinstance = PairList<boolean, [number, string]>;

// // [ [ Observable<X>, AccumFn<R, X> ], [ Observable<Y>, AccumFn<R, Y> ] ]




// const accumStringToNum: AccumFn<number, string> = (acc: number, _value: string) => acc;
// const accumBooleanToNum: AccumFn<number, boolean> = (acc: number, _value: boolean) => acc;
// const accumNumToNum: AccumFn<number, number> = (acc: number, _value: number) => acc;
// const stringSrc$: Observable<string> = of('str');
// const booleanSrc$: Observable<boolean> = of(true);
// const numberSrc$: Observable<number> = of(1);

// const strNumPair: SrcAccumPair<number, string> = [stringSrc$, accumStringToNum];
// const boolNumPair: SrcAccumPair<number, boolean> = [booleanSrc$, accumBooleanToNum];
// const numNumPair: SrcAccumPair<number, number> = [numberSrc$, accumNumToNum];

// //TODO: kill all consts and export consts (consts exported so the type-related errors will show up)

// interface rebuildtuplerecurser<L extends readonly unknown[], result extends readonly unknown[]> {
//     (): HeadReadonly<L> extends (infer U) ? rebuildtuplerhelper<Tail<L>, Append<U, result>> : never;
// }

// type rebuildtuplerhelper<L extends readonly unknown[], result extends readonly unknown[] = []> =
//     L extends undefined | null | void | [] ? result : rebuildtuplerecurser<L, result>;

// type rebuildtuple<L extends readonly unknown[]> = rebuildtuplerhelper<L>;

// type inspect = rebuildtuplerhelper<readonly [number, string]>;

// type inspect2 = HeadReadonly<readonly [number, string]>;

// //TODO: this is never vvvv
// type inspect3 = rebuildtuplerhelper<[], Append<number, [string]>>;


// //TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO:
// //TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO:
// // TODO: problem is it cant match to the interface that evaluates as "(): never"
// //TODO: (scratch above ^^^) keep working on this one, got it changed from never to [number]
// //x ^^^ (part of the reason is I accidentally left the "rebuildtuplehelper" condition's else to be "never", not "result")//TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO:
// //TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO:
// //TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO:
// export const testtuple: rebuildtuple<readonly [number, string]> = //x;
//     [1, 'hello'] /* as const; */ as readonly [number, string];

// const val = [1, 'hello'] as const;

// //TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO:
// //TODO: why????? ^^^^^^^^
// //TODO: N.B:  FOR LITERAL TUPLE TYPES, APPEND "as const"! (maybe "readonly" for the type alias/interfaces!)
// //TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO: TODO:
// export const instancelist: [
//     SrcAccumPair<number, string>,
//     SrcAccumPair<number, boolean>,
//     SrcAccumPair<number, number>
// ] = [
//         [stringSrc$, accumStringToNum],
//         [booleanSrc$, accumBooleanToNum],
//         [numberSrc$, accumNumToNum]
//     ];

// export const theIdealInstanceList: ThePairList<number, [string, boolean, number]> = [
//     [stringSrc$, accumStringToNum],
//     [booleanSrc$, accumBooleanToNum],
//     [numberSrc$, accumNumToNum]
// ];

// export const testTarget: ThePairList<number, [string, boolean, number]> = [strNumPair, boolNumPair, numNumPair];
// export const betterTestTarget: TheBetterPairList<number> = [strNumPair, boolNumPair, numNumPair];

// export const testFail: ThePairList<number, [string, number, boolean]> = [strNumPair, boolNumPair, numNumPair];

// interface ThePairListRecurser<R, Args extends unknown[], Result extends unknown[]> {
//     (): Head<Args> extends SrcAccumPair<R, infer U> ?
//         ThePairListHelper<R, Tail<Args>, Append<Result, SrcAccumPair<R, U>>> :
//         never;
// }

// // type ThePairListHelper<R, Args extends unknown[], Result extends unknown[] = []> =
// //     HasTail<Args> extends true ?
// //     ThePairListRecurser<R, Args, Result> :
// //     Result;
// interface ThePairListHelper<R, Args extends unknown[], Result extends unknown[] = []> {
//     (): HasTail<Args> extends true ?
//         ThePairListRecurser<R, Args, Result> :
//         Result;
// }

// type ThePairList<R, L extends unknown[]> = ThePairListHelper<R, L>;
// // interface GenericTupleRecurser {
// //     ():
// // };

// // type GenericTupleHelper =

// // ;

// // type GenericTuple = ;

// // type expect = IsSame<
// //     ThePairList<boolean, [number, string]>,
// //     [AccumSrcPair<boolean, number>, AccumSrcPair<boolean, string>]
// // >;


interface IndexMapRecurser<
    L extends unknown[],
    Iter extends unknown[],
    Result extends { [_: number]: unknown; }
    > {
    (): IndexMapHelper<
        Tail<L>,
        Next<Iter>,
        Result & { [_ in Pos<Iter>]: Head<L> }
    >
}

interface IndexMapHelper<
    L extends unknown[],
    Iter extends unknown[] = [],
    Result extends { [_: number]: unknown; } = {}
    > {
    (): L extends null | void | undefined | [] ?
        Result : IndexMapRecurser<L, Iter, Result>;
}

interface SrcListFromSrcAccumListRecurser<
    R,
    L extends SrcAccumPair<R, unknown>[],
    Result extends unknown[]
    > { (): SrcListFromSrcAccumListHelper<R, Tail<L>, Append<SrcInPair<R, Head<L>>, Result>>; }

type SrcListFromSrcAccumListHelper<
    R,
    L extends SrcAccumPair<R, unknown>[],
    Result extends unknown[] = []
    > = L extends null | void | undefined | [] ?
    Result : SrcListFromSrcAccumListRecurser<R, L, Result>;

interface AccumMapRecurser<
    R,
    L extends unknown[],
    Iter extends unknown[],
    Result extends { [_: number]: unknown; }
    > {
    (): AccumMapHelper<
        R,
        Tail<L>,
        Next<Iter>,
        Result & { [_ in Pos<Iter>]: AccumFn<R, Head<L>>; }
    >;
}

type AccumMapHelper<
    R,
    L extends unknown[],
    Iter extends unknown[] = [],
    Result extends { [_: number]: unknown; } = {}
    > = L extends null | void | undefined | [] ?
    Result : AccumMapRecurser<R, L, Iter, Result>;

// // interface SrcUnionRecurser<
// //     R,
// //     L extends AccumSrcPair<R, unknown>[],
// //     Result
// //     > { (): SrcUnionHelper<R, Tail<L>, Result | SrcInPair<R, Head<L>>>; };

// // type SrcUnionHelper<
// //     R,
// //     L extends AccumSrcPair<R, unknown>[],
// //     Result = never
// //     > = L extends undefined | null | void | [] ? Result : SrcUnionRecurser<R, L, Result>;

interface SrcUnionRecurser<
    R,
    L extends SrcAccumPair<R, unknown>[],
    Result
    > { (): SrcUnionHelper<R, Tail<L>, Result | SrcInPair<R, Head<L>>>; }

// // interface SrcUnionHelper<
// //     R,
// //     L extends AccumSrcPair<R, unknown>[],
// //     Result = never
// //     > {
// //     (): L extends undefined | null | void | [] ? Result :

// //         SrcUnionRecurser<R, L, Result>;
// // }
type SrcUnionHelper<
    R,
    L extends SrcAccumPair<R, unknown>[],
    Result = never
    > = L extends undefined | null | void | [] ? Result : SrcUnionRecurser<R, L, Result>;


export type SrcUnion<R, L extends AccumSrcPair<R, unknown>[]> =
    SrcUnionHelper<R, L>;


// type testing<R> = SrcUnion<R, [SrcAccumPair<R, number>, SrcAccumPair<R, string>]>;

// //TODO: kill the test type when done...
// type TestSrcUnion<R, L extends SrcAccumPair<R, unknown>[]> = L extends undefined | null | void | [] ? true : false;

// type TestInstance<R> = TestSrcUnion<R, PairList<R>>;
// type othertest<R> = TestSrcUnion<R, SrcAccumPair<R, unknown>[]>;

// type testhelper<R> = SrcUnionHelper<R, [SrcAccumPair<R, number>, SrcAccumPair<R, string>]>;
// type instantiate = testhelper<boolean>;
// type x = number extends instantiate ? true : false;

// type intertest<R> = SrcUnionHelper<R, [], never | SrcInPair<R, SrcAccumPair<R, string>>>; // === SrcUnionHelper<R, [], string>;
// type otherintertest<R> = [] extends undefined | null | void | [] ? string : SrcUnionRecurser<R, [], string>; // === string

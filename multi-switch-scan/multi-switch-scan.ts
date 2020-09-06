import { merge, MonoTypeOperatorFunction, Observable } from 'rxjs';
import { map, scan, shareReplay, startWith, switchMap } from 'rxjs/operators';

import {
    AccumMap,
    IndexMap,
    IsSame,
    PairList,
    SourceMapper,
    SrcUnion,
    ValueIndexPair,
} from './internal/types';

export const multiSwitchScan = <R, P extends PairList<R>>(
    ...srcAccumList: P
): MonoTypeOperatorFunction<R> => {

    //TODO: these extra types, probably unnecessary
    type SrcTypes = SrcUnion<R, P>;

    const accumMap: AccumMap<R, P> =
        srcAccumList.reduce(
            <I extends keyof IndexMap<P>>(
                accumObj: Partial<AccumMap<R, P>>,
                [, accumFn]: IndexMap<P>[I],
                index: I
            ): Partial<AccumMap<R, P>> => ({ ...accumObj, [index]: accumFn }),
            {}
        ) as AccumMap<R, P>;
    //TODO: some of these type coersions ^^^ should be unnecessary when it's all fixed

    const sourceMapper: SourceMapper<R, P, SrcTypes> = ([src], index) => {
        const srcObs$ = src;
        return srcObs$.pipe(
            map(value => ({ value, index }))
        ) as typeof srcObs$ extends Observable<infer U> ? (
            IsSame<U, SrcTypes> extends false ? (
                U extends SrcTypes ?
                Observable<ValueIndexPair<R, P, U>> : never
            ) : never
        ) : never;
    };
    const sources = srcAccumList.map(sourceMapper);

    //TODO: ValueIndexPair<R, P, SrcTypes> is never. why?
    const accumulator = (
        accum: R,
        { index: accumIndexer, value }: ValueIndexPair<R, P, SrcTypes>,
        index: number
    ): R =>
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        accumIndexer === -1 ?
            accum :
            (accumMap[accumIndexer]/*  as AccumFn<R, typeof value> */)(accum, value, index);
    //TODO: once the "never" issue is fixed, this ^^^ type coersion should not be needed...

    return (source: Observable<R>) =>
        source.pipe(
            switchMap((src: R) =>
                merge(...sources).pipe(
                    startWith<{ value: any, index: number }>({ value: null, index: -1 }),
                    scan(accumulator, src),
                    shareReplay({ bufferSize: 1, refCount: true })
                )
            )
        );
};

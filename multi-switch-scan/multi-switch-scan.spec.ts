import { Observable } from 'rxjs';
import { NamedCase } from 'rxjs-marbles/cases';
import { cases, Context, marbles } from 'rxjs-marbles/jest';
import { TestObservableLike } from 'rxjs-marbles/types';

import { AccumFn } from './internal/types';
import { multiSwitchScan } from './multi-switch-scan';

//TODO: revert launch.json

//TODO: add tests for multiple inputs and for applying changes correctly by adding
//x        (via an extrangeous mergescan) extra SrcAccumPair's after source emissions started
//x        are the initial accums maintained? and are the new accums added on top of those ones?
describe('multiSwitchScan', () => {
    interface TestData extends NamedCase {
        name: string;
        argsSrcA: [string, { [_: string]: string; }];
        argsSrcB: [string, { [_: string]: number; }];
        argsExpected: [string, { [_: string]: (string | number)[]; }];
        sourceSubscriptions: string | string[];
        aSubscriptions: string | string[];
        bSubscriptions: string | string[];
    }

    let pipeSource$: Observable<(string | number)[]>;
    let srcA$: Observable<string>;
    let srcB$: Observable<number>;

    const aEmissions = { a: 'A', b: 'B', c: 'C', d: 'D' };
    const aValues = Object.values(aEmissions);
    const bEmissions = { 1: 1, 2: 2, 3: 3, 4: 4 };

    const acc1: AccumFn<(string | number)[], string> = (acc, value, _) =>
        [...acc, value];

    const acc2: AccumFn<(string | number)[], number> = (acc, value, _) =>
        [value, ...acc];

    const getActual$ = (): Observable<(string | number)[]> =>
        pipeSource$.pipe(
            multiSwitchScan([srcA$, acc1], [srcB$, acc2])
        );

    describe('with no pipe source emissions', () => {
        let subscription: string;
        let expected$: TestObservableLike<(string | number)[]>;

        beforeEach(
            marbles((m: Context) => {
                pipeSource$ = m.cold('---|');
                subscription = '      ^--!';
                expected$ = m.cold('  ---|');
            })
        );

        it('should not emit any values if the pipeline source has not emitted yet',
            marbles((m: Context) => {
                // pipeSource$: '---|'
                srcA$ = m.hot('  |');
                srcB$ = m.hot('  |');
                m.expect(getActual$()).toBeObservable(expected$);
                m.expect(pipeSource$).toHaveSubscriptions(subscription);
            })
        );

        it('should not emit any values when srcA emits, if the pipline source has not emitted yet',
            marbles((m: Context) => {
                srcA$ = m.hot('^a-|', { a: 'a' });
                srcB$ = m.hot('(^|)');
                m.expect(getActual$()).toBeObservable(expected$);
                m.expect(pipeSource$).toHaveSubscriptions(subscription);
            })
        );

        it('should not emit any values when srcB emits, if the pipeline source has not emitted yet',
            marbles((m: Context) => {
                srcA$ = m.hot('  ^|');
                srcB$ = m.hot('--^a|', { a: 1 });
                m.expect(getActual$()).toBeObservable(expected$);
                m.expect(pipeSource$).toHaveSubscriptions(subscription);
            })
        );
        it('should not emit any values when both srcA and srcB emit, if the pipeline source has not emitted yet',
            marbles((m: Context) => {
                srcA$ = m.hot('--^a--|', { a: 'a' });
                srcB$ = m.hot(' -^-a---|', { a: 1 });
                m.expect(getActual$()).toBeObservable(expected$);
                m.expect(pipeSource$).toHaveSubscriptions(subscription);
            })
        );
    });

    describe('with one pipe source emission', () => {
        const pipeEmission = [10, 'foo', 20, 'bar'];
        const testList: TestData[] = [
            {
                name: 'should emit the same value that the pipeline source emits',
                // pipeSource$:       -a-|
                argsSrcA: ['          (^|)', null],
                argsSrcB: ['          (^|)', null],
                argsExpected: ['      -a-|', { a: pipeEmission }],
                sourceSubscriptions: '^--!',
                aSubscriptions: '     -(^!)',
                bSubscriptions: '     -(^!)'
            },
            {
                name: 'should accumulate the value emitted by srcA, according to acc1',
                // pipeSource$:       -a-|
                argsSrcA: ['          ^-a-|', { a: 'A' }],
                argsSrcB: ['          (^|)', null],
                argsExpected: ['      -ab-|', {
                    a: pipeEmission,
                    b: [...pipeEmission, 'A']
                }],
                sourceSubscriptions: '^--!',
                aSubscriptions: '     -^--!',
                bSubscriptions: '     -(^!)'
            },
            {
                name: 'should accumulate the value emitted by srcB, according to acc2',
                // pipeSource$:       -a-|
                argsSrcA: ['          (^|)', null],
                argsSrcB: ['          ^-a--|', { a: 1 }],
                argsExpected: ['      -ab--|', {
                    a: [...pipeEmission],
                    b: [1, ...pipeEmission]
                }],
                sourceSubscriptions: '^--!',
                aSubscriptions: '     -(^!)',
                bSubscriptions: '     -^---!'
            },
            {
                name: 'should accumulate multiple emissions by srcA, according to acc1',
                // pipeSource$:       -a-|
                argsSrcA: ['          ^-ab---c--d|', aEmissions],
                argsSrcB: ['          (^|)', null],
                argsExpected: ['      -abc---d--e|', {
                    a: [...pipeEmission],
                    b: [...pipeEmission, aValues[0]],
                    c: [...pipeEmission, ...aValues.slice(0, 2)],
                    d: [...pipeEmission, ...aValues.slice(0, 3)],
                    e: [...pipeEmission, ...aValues]
                }],
                sourceSubscriptions: '^--!',
                aSubscriptions: '    -^---------!',
                bSubscriptions: '     -(^!)'
            },
            {
                name: 'should accumulate multiple emissions by srcB, according to acc2',
                // pipeSource$:       -a-|
                argsSrcA: ['          (^|)', null],
                argsSrcB: ['          ---^12--3---4|', bEmissions],
                argsExpected: ['      -ab--c---d|', {
                    a: [...pipeEmission],
                    b: [2, ...pipeEmission],
                    c: [3, 2, ...pipeEmission],
                    d: [4, 3, 2, ...pipeEmission]
                }],
                sourceSubscriptions: '^--!',
                aSubscriptions: '     -(^!)',
                bSubscriptions: '     -^--------!'
            },
            {
                name: 'should accumulate mixed emissions by srcA and srcB, according to acc1 and acc2, respectively',
                // pipeSource$:       -a-|
                argsSrcA: ['          ^-a- -b-- -c-- --d- --|', aEmissions],
                argsSrcB: ['          ^--1 -2-- ---- 3--4 |', bEmissions],
                argsExpected: ['      -ia1 -(b2 )c-- 3-d4 --|', {
                    i: [...pipeEmission],
                    a: [...pipeEmission, 'A'],
                    1: [1, ...pipeEmission, 'A'],
                    b: [1, ...pipeEmission, 'A', 'B'],
                    2: [2, 1, ...pipeEmission, 'A', 'B'],
                    c: [2, 1, ...pipeEmission, 'A', 'B', 'C'],
                    3: [3, 2, 1, ...pipeEmission, 'A', 'B', 'C'],
                    d: [3, 2, 1, ...pipeEmission, 'A', 'B', 'C', 'D'],
                    4: [4, 3, 2, 1, ...pipeEmission, 'A', 'B', 'C', 'D']
                }],
                sourceSubscriptions: '^--!',
                aSubscriptions: '     -^-- ---- ---- ---- --!',
                bSubscriptions: '     -^-- ---- ---- ---- !'
            }
        ];

        beforeEach(
            marbles((m: Context) => {
                pipeSource$ = m.cold('-a-|', { a: [...pipeEmission] });
            })
        );

        cases(
            'should support single-emit cases',
            (m: Context, {
                argsSrcA,
                argsSrcB,
                argsExpected,
                sourceSubscriptions,
                aSubscriptions,
                bSubscriptions
            }: TestData) => {
                // hot('(^|)')
                srcA$ = m.hot(...argsSrcA);
                // hot('(^|)')
                srcB$ = m.hot(...argsSrcB);
                const expected$ = m.cold(...argsExpected);
                m.expect(getActual$()).toBeObservable(expected$);
                m.expect(pipeSource$).toHaveSubscriptions(sourceSubscriptions);
                m.expect(srcA$).toHaveSubscriptions(aSubscriptions);
                m.expect(srcB$).toHaveSubscriptions(bSubscriptions);
            },
            testList
        );
    });

    describe('with multiple pipe source emissions', () => {
        interface MultiEmitTestData extends TestData {
            pipeSourceArgs: [string, { [_: string]: (string | number)[] }];
        }

        const firstPipeEmission = [10, 'foo', 20, 'bar'];
        const secondPipeEmission = ['fizz', 100, 'buzz', 200];

        const testList: MultiEmitTestData[] = [
            {
                name: 'should discard accumulations and emit the same value that the pipeline source emits',
                pipeSourceArgs: ['    -a-- ---- ---- ---- ---- ---- --b|', {
                    a: [...firstPipeEmission],
                    b: [...secondPipeEmission]
                }],
                argsSrcA: ['          ^-a- -b-- -c-- --d- --|', aEmissions],
                argsSrcB: ['          ^--1 -2-- ---- 3--4 |', bEmissions],
                sourceSubscriptions: '^--- ---- ---- ---- ---- ---- ---!',
                aSubscriptions: [
                    '                 -^-- ---- ---- ---- --!',
                    '                 ---- ---- ---- ---- ---- ---- --(^!)'
                ],
                bSubscriptions: [
                    '                 -^-- ---- ---- ---- !',
                    '                 ---- ---- ---- ---- ---- ---- --(^ !)'
                ],
                argsExpected: ['      -ia1 -(b2 )c-- 3-d4 ---- ---- --z|', {
                    i: [...firstPipeEmission],
                    a: [...firstPipeEmission, 'A'],
                    1: [1, ...firstPipeEmission, 'A'],
                    b: [1, ...firstPipeEmission, 'A', 'B'],
                    2: [2, 1, ...firstPipeEmission, 'A', 'B'],
                    c: [2, 1, ...firstPipeEmission, 'A', 'B', 'C'],
                    3: [3, 2, 1, ...firstPipeEmission, 'A', 'B', 'C'],
                    d: [3, 2, 1, ...firstPipeEmission, 'A', 'B', 'C', 'D'],
                    4: [4, 3, 2, 1, ...firstPipeEmission, 'A', 'B', 'C', 'D'],
                    z: [...secondPipeEmission]
                }]
            },
            {
                name: 'should accumulate mixed emissions, starting after the discarded accumulations on source re-emit',
                pipeSourceArgs: ['    -a-- -b-|', {
                    a: [...firstPipeEmission],
                    b: [...secondPipeEmission]
                }],
                argsSrcA: ['          ^--- ---- ---- -a-- b--- c--- -d-- -|', aEmissions],
                argsSrcB: ['          ^--- ---- ---- --1- 2--- ---3 --4|', bEmissions],
                sourceSubscriptions: '^--- ---!',
                aSubscriptions: [
                    '                 -^-- -!',
                    '                 ---- -^-- ---- ---- ---- ---- ---- -!'
                ],
                bSubscriptions: [
                    '                 -^-- -!',
                    '                 ---- -^-- ---- ---- ---- ---- ---!'
                ],
                argsExpected: ['      -i-- -z-- ---- -a1- (b2) c--3 -d4- -|', {
                    i: [...firstPipeEmission],
                    z: [...secondPipeEmission],
                    a: [...secondPipeEmission, 'A'],
                    1: [1, ...secondPipeEmission, 'A'],
                    b: [1, ...secondPipeEmission, 'A', 'B'],
                    2: [2, 1, ...secondPipeEmission, 'A', 'B'],
                    c: [2, 1, ...secondPipeEmission, 'A', 'B', 'C'],
                    3: [3, 2, 1, ...secondPipeEmission, 'A', 'B', 'C'],
                    d: [3, 2, 1, ...secondPipeEmission, 'A', 'B', 'C', 'D'],
                    4: [4, 3, 2, 1, ...secondPipeEmission, 'A', 'B', 'C', 'D']
                }]
            }
        ];

        cases(
            'should support multi-emit cases',
            (m: Context, {
                pipeSourceArgs,
                argsSrcA,
                argsSrcB,
                argsExpected,
                sourceSubscriptions,
                aSubscriptions,
                bSubscriptions
            }: MultiEmitTestData) => {
                pipeSource$ = m.cold(...pipeSourceArgs);
                srcA$ = m.hot(...argsSrcA);
                srcB$ = m.hot(...argsSrcB);
                const expected$ = m.cold(...argsExpected);
                m.expect(getActual$()).toBeObservable(expected$);
                m.expect(pipeSource$).toHaveSubscriptions(sourceSubscriptions);
                m.expect(srcA$).toHaveSubscriptions(aSubscriptions);
                m.expect(srcB$).toHaveSubscriptions(bSubscriptions);
            },
            testList
        );
    });
});

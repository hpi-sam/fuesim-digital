import type {
    ExerciseAction,
    ExerciseState,
    StateExport,
} from 'fuesim-digital-shared';
import {
    applyAction,
    cloneDeepMutable,
    migrateStateExport,
    reduceExerciseState,
    sortObject,
    StrictObject,
    validateExerciseExport,
} from 'fuesim-digital-shared';
import { produce, freeze } from 'immer';
import { isEqual } from 'lodash-es';
import type { BenchmarkValue } from './benchmark.js';
import { benchmark } from './benchmark.js';
import { BenchmarkStep } from './benchmark-step.js';
import { CalculationStep } from './calculation-step.js';
import { print } from './print.js';
import type { Step } from './step.js';

export class StepState {
    /**
     * The end result of the state export migration
     */
    public readonly migrate?: BenchmarkValue<StateExport>;
    /**
     * The end result of the exercise validation
     * The value is an array of the errors
     */
    public readonly validateExercise?: BenchmarkValue<
        ReturnType<typeof validateExerciseExport>
    >;
    /**
     * The frozen state of the exercise
     */
    public readonly freezeState?: {
        initialState: ExerciseState;
        actionHistory: readonly ExerciseAction[];
    };
    // There are three different ways to create the end state of the exercise
    public readonly newImmerDraft?: BenchmarkValue<ExerciseState>;
    public readonly sameImmerDraft?: BenchmarkValue<ExerciseState>;
    public readonly noImmerDraft?: BenchmarkValue<ExerciseState>;
    /**
     * Whether the end states of all three methods to create them are equal
     */
    public readonly endStatesAreEqual?: boolean;
    /**
     * The total benchmarked time it took to execute one action of each type in ms
     * (sum of all benchmarked times)
     * Sorted by time (descending)
     */
    public readonly benchmarkActions?: {
        [Key in ExerciseAction['type']]?: number;
    };
    /**
     * A string with the most expensive action in the exercise (by total summed-up time) and a representation of the respective time
     */
    public readonly mostExpensiveAction?: string;
    /**
     * The number of actions of each type
     * Sorted by amount (descending)
     */
    public readonly numberOfActionsPerType?: {
        [Key in ExerciseAction['type']]?: number;
    };
    /**
     * The number of actions in the exercise
     */
    // The key is used as the column-name in the table, therefore the weird name
    public readonly '#actions'?: number;

    public constructor(public readonly data: StateExport) {}
}

/**
 * The steps are executed for each state export.
 * The steps are executed in the order they are defined.
 * The result of each step is stored in `stepState[stateName]`.
 * Each step can only access the results of the previous steps.
 *`stepState.data` is always available.
 *
 * Steps can print to the console and throw errors to stop the execution of the specific exercise-state.
 * In addition, at the end of the benchmark, there is a summary of the results in the form of a table.
 * A lot of this is specified in the individual step classes.
 */
export const steps: Step<StepState>[] = [
    new BenchmarkStep(
        'migrate',
        ({ data }) => migrateStateExport(data) as StateExport
    ),
    new BenchmarkStep('validateExercise', ({ migrate: migratedValues }) =>
        validateExerciseExport(migratedValues!.value)
    ),
    new CalculationStep(
        'freezeState',
        ({ migrate: migratedValues }) => {
            if (!migratedValues?.value.history) {
                throw new Error('State export is missing history');
            }
            const history = migratedValues.value.history;
            freeze(history, true);
            return history;
        },
        false
    ),
    new BenchmarkStep('newImmerDraft', ({ freezeState }) => {
        const { actionHistory, initialState } = freezeState!;

        // Apply each action on a new immer draft
        return actionHistory.reduce(
            (state, action) => reduceExerciseState(state, action),
            initialState
        );
    }),
    new BenchmarkStep('sameImmerDraft', ({ freezeState }) => {
        const { actionHistory, initialState } = freezeState!;

        // Apply all action on the same immer draft
        return produce(initialState, (draftState) => {
            for (const action of actionHistory) {
                applyAction(draftState, action);
            }
        });
    }),
    new BenchmarkStep('noImmerDraft', ({ freezeState }) => {
        const { actionHistory, initialState } = freezeState!;

        // Apply all action on the same immer draft
        return actionHistory.reduce(
            (state, action) => applyAction(state, action),
            cloneDeepMutable(initialState)
        );
    }),
    new CalculationStep(
        'endStatesAreEqual',
        ({ newImmerDraft, sameImmerDraft, noImmerDraft }) => {
            const endStatesAreEqual =
                isEqual(newImmerDraft!.value, sameImmerDraft!.value) &&
                isEqual(newImmerDraft!.value, noImmerDraft!.value);
            if (!endStatesAreEqual) {
                print(
                    `  The endStates of the previous three steps are not equal!
  This most likely means that a reducer is either not deterministic or makes some assumptions about immer specific stuff (use of "original()").
  To further debug this, you should log the endStates of the respective exercises and can compare them directly in vscode via "Compare file with".
`,
                    'red'
                );
            }
            return endStatesAreEqual;
        },
        false
    ),

    new CalculationStep(
        'benchmarkActions',
        ({ freezeState }) => {
            print(`  benchmarkActions: `);
            const { actionHistory, initialState } = freezeState!;
            const totalTimePerAction: {
                [Key in ExerciseAction['type']]?: number;
            } = {};
            let currentState = initialState;
            for (const action of actionHistory) {
                // eslint-disable-next-line @typescript-eslint/no-loop-func
                const { value: newState, time } = benchmark(() =>
                    reduceExerciseState(currentState, action)
                );

                currentState = newState;
                totalTimePerAction[action.type] =
                    (totalTimePerAction[action.type] ?? 0) + time;
            }
            const sortedTotalTimePerAction = sortObject(
                totalTimePerAction,
                ([, timeA], [, timeB]) => timeB! - timeA!
            );
            print(
                // In the object are only entries we explicitly set -> no need to check for undefined
                (
                    StrictObject.entries(sortedTotalTimePerAction) as [
                        ExerciseAction['type'],
                        number,
                    ][]
                )
                    .map(([type, time]) => `${type}: ${time.toFixed(2)}ms`)
                    .join(', ')
            );
            print(`\n`);
            return sortedTotalTimePerAction;
        },
        false
    ),
    new CalculationStep(
        'mostExpensiveAction',
        ({ benchmarkActions, newImmerDraft }) => {
            const mostExpensiveAction = StrictObject.entries(
                benchmarkActions!
            )[0];
            if (!mostExpensiveAction) {
                return `No actions`;
            }
            const summedUpExerciseTime =
                StrictObject.values(benchmarkActions!).reduce(
                    // In the object are only entries we explicitly set
                    (totalTime, timePerAction) => totalTime! + timePerAction!,
                    0
                ) ?? 0;
            const summedUpVsDirectTime =
                summedUpExerciseTime / newImmerDraft!.time;
            if (summedUpVsDirectTime > 1.1 || summedUpVsDirectTime < 0.9) {
                print(
                    `    The summed up time of all actions is ${summedUpVsDirectTime.toFixed(
                        2
                    )} times the time of the direct benchmark ("newImmerDraft").\n`,
                    'yellow'
                );
            }

            return `${mostExpensiveAction[0]} ${(
                (mostExpensiveAction[1]! / summedUpExerciseTime) *
                100
            ).toFixed(2)}%`;
        }
    ),
    new CalculationStep(
        'numberOfActionsPerType',
        ({ freezeState }) => {
            print(`  numberOfActionsPerType: `);
            const { actionHistory } = freezeState!;
            const numberOfActionsPerType: {
                [Key in ExerciseAction['type']]?: number;
            } = {};
            for (const action of actionHistory) {
                numberOfActionsPerType[action.type] =
                    (numberOfActionsPerType[action.type] ?? 0) + 1;
            }
            const sortedNumberOfActionsPerType = sortObject(
                numberOfActionsPerType,
                ([, amountA], [, amountB]) => amountB! - amountA!
            );
            print(
                // In the object are only entries we explicitly set -> no need to check for undefined
                (
                    StrictObject.entries(sortedNumberOfActionsPerType) as [
                        ExerciseAction['type'],
                        number,
                    ][]
                )
                    .map(([type, amount]) => `${type}: ${amount}`)
                    .join(', ')
            );
            return sortedNumberOfActionsPerType;
        },
        false
    ),
    new CalculationStep(
        '#actions',
        ({ freezeState }) => freezeState!.actionHistory.length
    ),
];

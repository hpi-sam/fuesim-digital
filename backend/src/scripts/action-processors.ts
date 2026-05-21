import {
    getElement,
    getMeasureTemplate,
    type ExerciseAction,
    type ExerciseState,
} from 'fuesim-digital-shared';
import { z } from 'zod';
import type { WritableDraft } from 'immer';

export const processEventSchema = z.strictObject({
    'concept:name': z.string(),
    verboseName: z.string(),
    'time:timestamp': z.string(),
    'case:concept:name': z.string(),
    actionIndex: z.int().nonnegative(),
    actionType: z.string(),
    startTime: z.int().nonnegative(),
    endTime: z.int().nonnegative(),
});
export type ProcessEvent = z.infer<typeof processEventSchema>;

type ActionProcessorFunction<T extends ExerciseAction> = (
    currentState: ExerciseState,
    action: T
) => Omit<
    ProcessEvent,
    | 'actionIndex'
    | 'actionType'
    | 'case:concept:name'
    | 'endTime'
    | 'startTime'
    | 'time:timestamp'
>;

class ActionProcessor<T extends ExerciseAction['type']> {
    public type: ExerciseAction['type'];
    public process: ActionProcessorFunction<ExerciseAction & { type: T }>;
    public mergeSubsequent;

    processFull(
        currentState: ExerciseState,
        action: ExerciseAction & { type: T },
        actionIndex: number
    ): ProcessEvent {
        const partialEvent = this.process(currentState, action);
        return {
            ...partialEvent,
            'time:timestamp': new Date(currentState.currentTime).toISOString(),
            'case:concept:name': currentState.participantKey,
            actionIndex,
            actionType: action.type,
            startTime: currentState.currentTime,
            endTime: currentState.currentTime,
        };
    }

    public constructor(
        type: T,
        processor: ActionProcessorFunction<ExerciseAction & { type: T }>,
        mergeSubsequent: boolean = false
    ) {
        this.type = type;
        this.process = processor;
        this.mergeSubsequent = mergeSubsequent;
    }
}

export const actionProcessors = [
    new ActionProcessor('[Exercise] Start', (currentState, action) => ({
        'concept:name': action.type,
        verboseName: 'Übung starten',
    })),
    new ActionProcessor('[Exercise] Pause', (currentState, action) => ({
        'concept:name': action.type,
        verboseName: 'Übung pausieren',
    })),
    new ActionProcessor('[Measure] Add Measure', (currentState, action) => {
        const template = getMeasureTemplate(
            currentState as WritableDraft<ExerciseState>,
            action.measure.templateId
        );
        return {
            'concept:name': `[Measure] ${template.name}`,
            verboseName: template.name,
        };
    }),
    new ActionProcessor(
        '[Scoutable] Mark as viewed',
        (currentState, action) => {
            const scoutable = getElement(
                currentState,
                'scoutable',
                action.scoutableId
            );
            return {
                'concept:name': `[Scoutable] Viewed ${scoutable.name || scoutable.id}`,
                verboseName: `${scoutable.name || 'Etwas'} erkunden`,
            };
        }
    ),
    new ActionProcessor(
        '[Patient] Set Visible Status',
        (currentState, action) => ({
            'concept:name': action.type,
            verboseName: `Patienten vorsichten`,
        }),
        true
    ),
];

export const actionProcessorDictionary = Object.fromEntries(
    actionProcessors.map((p) => [p.type, p])
);

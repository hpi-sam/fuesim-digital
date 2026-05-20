import {
    getElement,
    getMeasureTemplate,
    getMeasureTemplate,
    type ExerciseAction,
    type ExerciseState,
} from 'fuesim-digital-shared';
import { z } from 'zod';
import type { WritableDraft } from 'immer';

export const processEventSchema = z.strictObject({
    name: z.string(),
    verboseName: z.string(),
    timestamp: z.int().nonnegative(),
});
export type ProcessEvent = z.infer<typeof processEventSchema>;

type ActionProcessorFunction<T extends ExerciseAction> = (
    currentState: ExerciseState,
    action: T
) => Omit<ProcessEvent, 'timestamp'>;

class ActionProcessor<T extends ExerciseAction['type']> {
    public type: ExerciseAction['type'];
    public process: ActionProcessorFunction<ExerciseAction & { type: T }>;

    processFull(
        currentState: ExerciseState,
        action: ExerciseAction & { type: T }
    ): ProcessEvent {
        const partialEvent = this.process(currentState, action);
        return { ...partialEvent, timestamp: currentState.currentTime };
    }

    public constructor(
        type: T,
        processor: ActionProcessorFunction<ExerciseAction & { type: T }>
    ) {
        this.type = type;
        this.process = processor;
    }
}

export const actionProcessors = [
    new ActionProcessor('[Exercise] Start', (currentState, action) => ({
        name: currentState.type,
        verboseName: 'Übung starten',
    })),
    new ActionProcessor('[Exercise] Pause', (currentState, action) => ({
        name: currentState.type,
        verboseName: 'Übung pausieren',
    })),
    new ActionProcessor('[Measure] Add Measure', (currentState, action) => {
        const template = getMeasureTemplate(
            currentState as WritableDraft<ExerciseState>,
            action.measure.templateId
        );
        return {
            name: `[Measure] ${template.name}`,
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
                name: `[Scoutable] Viewed ${scoutable.name || scoutable.id}`,
                verboseName: `${scoutable.name || 'Etwas'} erkundet`,
            };
        }
    ),
];

export const actionProcessorDictionary = Object.fromEntries(
    actionProcessors.map((p) => [p.type, p])
);

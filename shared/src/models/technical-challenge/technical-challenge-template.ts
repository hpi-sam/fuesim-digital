import { z } from 'zod';
import { cloneDeep } from 'lodash-es';
import { castDraft, type Immutable, type WritableDraft } from 'immer';
import { uuid, uuidSchema } from '../../utils/uuid.js';
import {
    type ImageProperties,
    imagePropertiesSchema,
} from '../utils/image-properties.js';
import { newNoPosition } from '../utils/position/no-position.js';
import { newSize } from '../utils/size.js';
import {
    type StateMachine,
    type StateMachineDefinition,
    stateMachineDefinitionSchema,
    stateMachineSchema,
} from './state-machine.js';
import type {
    TechnicalChallenge,
    TechnicalChallengeId,
} from './technical-challenge.js';
import { technicalChallengeSchema } from './technical-challenge.js';

export const technicalChallengeTemplateSchema = z
    .strictObject({
        type: z.literal('technicalChallengeTemplate'),
        stateMachines: z
            .record(stateMachineSchema.shape.id, stateMachineDefinitionSchema)
            .refine((obj) => Object.keys(obj).length > 0),
        primaryStateMachineId: stateMachineSchema.shape.id,
        id: uuidSchema,
        image: imagePropertiesSchema.optional(),
        name: z.string(),
    })
    .superRefine((template, ctx) => {
        if (!template.stateMachines[template.primaryStateMachineId]) {
            ctx.addIssue({
                code: 'custom',
                message:
                    'Die ID der primären Teilherausforderung existiert nicht in dieser technischen Herausforderung.',
            });
            return;
        }
        const primaryStateMachine =
            template.stateMachines[template.primaryStateMachineId]!;
        const invalidStates = Object.values(primaryStateMachine.states).filter(
            (state) => !state.image
        );
        if (invalidStates.length > 0) {
            ctx.addIssue({
                code: 'custom',
                message:
                    'Alle Zustände der primären Teilherausforderung müssen ein Bild für die Kartendarstellung besitzen.',
                path: [
                    'stateMachines',
                    primaryStateMachine.id,
                    'states',
                    invalidStates[0]!.id,
                ],
            });
        }
    });

export type TechnicalChallengeTemplate = Immutable<
    z.infer<typeof technicalChallengeTemplateSchema>
>;

export function newTechnicalChallengeFromTemplate(
    template: TechnicalChallengeTemplate,
    creationTime: number
): WritableDraft<TechnicalChallenge> {
    const {
        stateMachines: definitions,
        name,
        primaryStateMachineId,
    } = castDraft(cloneDeep(template));

    let newPrimaryStateMachineId: StateMachine['id'] | undefined;
    const fromDefinition = (
        definition: WritableDraft<StateMachineDefinition>
    ): WritableDraft<StateMachine> => {
        const newId = uuid() as StateMachine['id'];
        if (primaryStateMachineId === definition.id) {
            newPrimaryStateMachineId = newId;
        }
        return {
            ...definition,
            id: newId,
            simulationStartTime: creationTime,
            currentStateId: definition.initialStateId,
            taskTimeSpent: {},
            assignedPersonnel: {},
        };
    };
    const stateMachines = Object.fromEntries(
        Object.values(definitions)
            .map(fromDefinition)
            .map((s) => [s.id, s])
    );

    if (!newPrimaryStateMachineId) {
        console.error(
            `Unknown primary state machine in template: ${primaryStateMachineId}. Using first one state machine instead.`,
            template
        );

        newPrimaryStateMachineId = Object.values(stateMachines).at(0)!.id;
    }

    return castDraft(
        technicalChallengeSchema.parse({
            id: uuid() as TechnicalChallengeId,
            type: 'technicalChallenge',
            templateId: template.id,
            position: newNoPosition(),
            size: newSize(40, 40),
            name,
            primaryStateMachineId: newPrimaryStateMachineId,
            stateMachines,
        } satisfies TechnicalChallenge)
    );
}

export namespace TechnicalChallengeTemplate {
    export function getPrimaryStateMachine(
        template: TechnicalChallengeTemplate
    ): StateMachineDefinition {
        return template.stateMachines[template.primaryStateMachineId]!;
    }
    export function getImage(
        template: TechnicalChallengeTemplate
    ): ImageProperties {
        if (!template.image) {
            const primary = getPrimaryStateMachine(template);
            return primary.states[primary.initialStateId]!.image!; // primary state machine has image set
        }
        return template.image;
    }
}

import { z } from 'zod';
import type { Immutable, WritableDraft } from 'immer';
import { uuidSchema } from '../../utils/uuid.js';
import { type ImageProperties } from '../utils/image-properties.js';
import { positionSchema } from '../utils/position/position.js';
import { sizeSchema } from '../utils/size.js';

// eslint-disable-next-line import-x/no-cycle
import {
    type StateMachine,
    stateMachineSchema,
    type StateMachineState,
} from './state-machine.js';

export const technicalChallengeIdSchema =
    uuidSchema.brand<'TechnicalChallengeId'>();
export type TechnicalChallengeId = z.infer<typeof technicalChallengeIdSchema>;

export const technicalChallengeSchema = z
    .strictObject({
        id: technicalChallengeIdSchema,
        type: z.literal('technicalChallenge'),
        name: z.string(),
        templateId: uuidSchema,
        position: positionSchema,
        size: sizeSchema,
        primaryStateMachineId: stateMachineSchema.shape.id,
        stateMachines: z.record(
            stateMachineSchema.shape.id,
            stateMachineSchema
        ),
    })
    .superRefine((technicalChallenge, ctx) => {
        if (
            !technicalChallenge.stateMachines[
                technicalChallenge.primaryStateMachineId
            ]
        ) {
            ctx.addIssue({
                code: 'custom',
                message:
                    'Die ID der primären Teilherausforderung existiert nicht in dieser technischen Herausforderung.',
            });
            return;
        }
        const primaryStateMachine =
            technicalChallenge.stateMachines[
                technicalChallenge.primaryStateMachineId
            ]!;
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

export type TechnicalChallenge = Immutable<
    z.infer<typeof technicalChallengeSchema>
>;

export namespace TechnicalChallenge {
    export function getStateById(
        technicalChallenge: WritableDraft<TechnicalChallenge>,
        stateId: StateMachineState['id']
    ): WritableDraft<StateMachineState> | undefined;
    export function getStateById(
        technicalChallenge: TechnicalChallenge,
        stateId: StateMachineState['id']
    ): StateMachineState | undefined {
        const result = Object.values(technicalChallenge.stateMachines)
            .flatMap((machine) => Object.entries(machine.states))
            .find(([key, _]) => key === stateId);
        return result?.[1];
    }

    type PrimaryStateMachine = StateMachine & {
        states: {
            [key: StateMachineState['id']]: StateMachineState & {
                image: ImageProperties;
            };
        };
    };
    export function getPrimaryStateMachine(
        technicalChallenge: TechnicalChallenge
    ): PrimaryStateMachine {
        const stateMachine =
            technicalChallenge.stateMachines[
                technicalChallenge.primaryStateMachineId
            ];
        return stateMachine as PrimaryStateMachine;
    }
}

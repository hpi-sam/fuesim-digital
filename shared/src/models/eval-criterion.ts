import { z } from 'zod';
import type { UUID } from '../utils/uuid.js';
import { uuid, uuidSchema } from '../utils/uuid.js';
import type { TechnicalChallengeStateId } from './technical-challenge/state-machine.js';
import { technicalChallengeStateIdSchema } from './technical-challenge/state-machine.js';
import type { TechnicalChallengeId } from './technical-challenge/technical-challenge.js';
import { technicalChallengeIdSchema } from './technical-challenge/technical-challenge.js';
import type { PatientStatus } from './utils/patient-status.js';
import { patientStatusSchema } from './utils/patient-status.js';
import { EvalResult } from '../utils/eval-result.js';

export const boolEvalCriterionIdSchema = uuidSchema.brand(
    'BoolEvalCriterionId'
);
export type BoolEvalCriterionId = z.infer<typeof boolEvalCriterionIdSchema>;

export const numberEvalCriterionIdSchema = uuidSchema.brand(
    'NumberEvalcriterionId'
);
export type NumberEvalCriterionId = z.infer<typeof numberEvalCriterionIdSchema>;

export const evalCriterionIdSchema = z.union([
    boolEvalCriterionIdSchema,
    numberEvalCriterionIdSchema,
]);

export type EvalCriterionId = z.infer<typeof evalCriterionIdSchema>;

/* TODO @JohannesPotzi @Jogius : add showInTable attribute. Also, update addCriterion action accordingly. */
export const evalCriterionBaseSchema = z.strictObject({
    id: evalCriterionIdSchema,
    name: z.string(),
    type: z.literal('evalCriterion'),
});
export const boolEvalCriterionBaseSchema = z.strictObject({
    ...evalCriterionBaseSchema.shape,
});

export const andEvalCriterionSchema = z.strictObject({
    ...boolEvalCriterionBaseSchema.shape,
    criterionType: z.literal('andEvalCriterion'),
    children: z.array(boolEvalCriterionIdSchema).min(1),
});
export type AndEvalCriterion = z.infer<typeof andEvalCriterionSchema>;

export const orEvalCriterionSchema = z.strictObject({
    ...boolEvalCriterionBaseSchema.shape,
    criterionType: z.literal('orEvalCriterion'),
    children: z.array(boolEvalCriterionIdSchema).min(1),
});
export type OrEvalCriterion = z.infer<typeof orEvalCriterionSchema>;

export const notEvalCriterionSchema = z.strictObject({
    ...boolEvalCriterionBaseSchema.shape,
    criterionType: z.literal('notEvalCriterion'),
    child: boolEvalCriterionIdSchema,
});
export type NotEvalCriterion = z.infer<typeof notEvalCriterionSchema>;

/* TODO @JohannesPotzi @Jogius : maybe generalise this and include a comparative operator? */
export const greaterThanEvalCriterionSchema = z.strictObject({
    ...boolEvalCriterionBaseSchema.shape,
    criterionType: z.literal('greaterThanEvalCriterion'),
    leftChild: numberEvalCriterionIdSchema,
    rightChild: numberEvalCriterionIdSchema,
});
export type GreaterThanEvalCriterion = z.infer<
    typeof greaterThanEvalCriterionSchema
>;

/* TODO @JohannesPotzi @Jogius : drop the num attribute.  With this, also add a timestamp attribute to the timeStampEvalCriterionSchema and a num attribute to the constNumEvalCriterionSchema.*/
export const numberEvalCriterionBaseSchema = z.strictObject({
    ...evalCriterionBaseSchema.shape,
    num: z.number(),
});
export const constNumEvalCriterionSchema = z.strictObject({
    ...numberEvalCriterionBaseSchema.shape,
    criterionType: z.literal('constNumEvalCriterion'),
});
export type ConstNumEvalCriterion = z.infer<typeof constNumEvalCriterionSchema>;

export const countCompletedEvalCriterionSchema = z.strictObject({
    ...numberEvalCriterionBaseSchema.shape,
    criterionType: z.literal('countCompletedEvalCriterion'),
    children: z.array(boolEvalCriterionIdSchema).min(1),
});
export type CountCompletedEvalCriterion = z.infer<
    typeof countCompletedEvalCriterionSchema
>;

export const timeStampEvalCriterionSchema = z.strictObject({
    ...numberEvalCriterionBaseSchema.shape,
    criterionType: z.literal('timeStampEvalCriterion'),
});
export type TimeStampEvalCriterion = z.infer<
    typeof timeStampEvalCriterionSchema
>;
export const firstTrueAtEvalCriterionSchema = z.strictObject({
    ...timeStampEvalCriterionSchema.shape,
    criterionType: z.literal('firstTrueAtEvalCriterion'),
    child: evalCriterionIdSchema,
});
export type FirstTrueAtEvalCriterion = z.infer<
    typeof firstTrueAtEvalCriterionSchema
>;

export const countPatientsAtStatusEvalCriterionSchema = z.strictObject({
    ...numberEvalCriterionBaseSchema.shape,
    criterionType: z.literal('countPatientsAtStatusEvalCriterion'),
});
export type CountPatientsAtStatusEvalCriterion = z.infer<
    typeof countPatientsAtStatusEvalCriterionSchema
>;

export const doMeasureXTimesEvalCriterionSchema = z.strictObject({
    ...boolEvalCriterionBaseSchema.shape,
    criterionType: z.literal('doMeasureXTimesEvalCriterion'),
    targetCount: z.number(),
    targetMeasureId: uuidSchema,
});
/* TODO @JohannesPotzi @Jogius : Drop this and add a measure count criterion and a template to the combined criteria creation form using the greater than criterion with comparative operator attribute. */
export type DoMeasureXTimesEvalCriterion = z.infer<
    typeof doMeasureXTimesEvalCriterionSchema
>;

export const reachTechnicalChallengeStateEvalCriterionSchema = z.strictObject({
    ...boolEvalCriterionBaseSchema.shape,
    criterionType: z.literal('reachTechnicalChallengeStateEvalCriterion'),
    targetTechnicalChallengeId: technicalChallengeIdSchema,
    targetTechnicalChallengeStateId: technicalChallengeStateIdSchema,
});
export type ReachTechnicalChallengeStateEvalCriterion = z.infer<
    typeof reachTechnicalChallengeStateEvalCriterionSchema
>;

export const patientAtStatusEvalCriterionSchema = z.strictObject({
    ...boolEvalCriterionBaseSchema.shape,
    criterionType: z.literal('patientAtStatusEvalCriterion'),
    targetPatientId: uuidSchema,
    targetStatus: patientStatusSchema,
});
export type PatientAtStatusEvalCriterion = z.infer<
    typeof patientAtStatusEvalCriterionSchema
>;

/* TODO @JohannesPotzi @Jogius : Drop this and add a patient count criterion and a template to the combined criteria creation form using the greater than criterion with comparative operator attribute. */
export const xPatientsAtStatusEvalCriterionSchema = z.strictObject({
    ...boolEvalCriterionBaseSchema.shape,
    criterionType: z.literal('xPatientsAtStatusEvalCriterion'),
    targetCount: z.number(),
    targetStatus: patientStatusSchema,
});
export type XPatientsAtStatusEvalCriterion = z.infer<
    typeof xPatientsAtStatusEvalCriterionSchema
>;

export const viewScoutableEvalCriterionSchema = z.strictObject({
    ...boolEvalCriterionBaseSchema.shape,
    criterionType: z.literal('viewScoutableEvalCriterion'),
    targetScoutableId: uuidSchema,
});
export type ViewScoutableEvalCriterion = z.infer<
    typeof viewScoutableEvalCriterionSchema
>;

/* TODO @JohannesPotzi @Jogius : lessThanXUnqualifiedMeasuresEvalCriterion : as a template in the combined criteria creation form using the greater than criterion with comparative operator attribute. */

export const boolEvalCriterionLeafSchema = z.discriminatedUnion(
    'criterionType',
    [
        reachTechnicalChallengeStateEvalCriterionSchema,
        patientAtStatusEvalCriterionSchema,
        viewScoutableEvalCriterionSchema,
        doMeasureXTimesEvalCriterionSchema,
        xPatientsAtStatusEvalCriterionSchema,
    ]
);
export type BoolEvalCriterionLeaf = z.infer<typeof boolEvalCriterionLeafSchema>;

export const targetCountCriterionSchema = z.discriminatedUnion(
    'criterionType',
    [doMeasureXTimesEvalCriterionSchema, xPatientsAtStatusEvalCriterionSchema]
);
export type TargetCountEvalCriterion = z.infer<
    typeof targetCountCriterionSchema
>;

export const boolEvalCriterionSchema = z.discriminatedUnion('criterionType', [
    boolEvalCriterionLeafSchema,
    andEvalCriterionSchema,
    orEvalCriterionSchema,
    notEvalCriterionSchema,
    greaterThanEvalCriterionSchema,
]);
export type BoolEvalCriterion = z.infer<typeof boolEvalCriterionSchema>;

export const numberEvalCriterionSchema = z.discriminatedUnion('criterionType', [
    constNumEvalCriterionSchema,
    countPatientsAtStatusEvalCriterionSchema,
    countCompletedEvalCriterionSchema,
    timeStampEvalCriterionSchema,
    firstTrueAtEvalCriterionSchema,
]);
export type NumberEvalCriterion = z.infer<typeof numberEvalCriterionSchema>;

export const evalCriterionSchema = z.discriminatedUnion('criterionType', [
    boolEvalCriterionSchema,
    numberEvalCriterionSchema,
]);
export type EvalCriterion = z.infer<typeof evalCriterionSchema>;

export type EvalCriterionCategory =
    | 'boolEvalCriterion'
    | 'combinedEvalCriterion'
    | 'numberEvalCriterion';

export const evalCriterionCategoryNames = {
    boolEvalCriterion: 'Erfüllbares Kriterium',
    numberEvalCriterion: 'Zahl-/Zähl Kriterium',
    combinedEvalCriterion: 'Kombiniertes Kriterium',
} as const satisfies { [Key in EvalCriterionCategory]: string };

export type BoolEvalCriterionType = BoolEvalCriterion['criterionType'];
export const boolEvalCritrionTypes = [
    'andEvalCriterion',
    'orEvalCriterion',
    'notEvalCriterion',
    'doMeasureXTimesEvalCriterion',
    'greaterThanEvalCriterion',
    'patientAtStatusEvalCriterion',
    'reachTechnicalChallengeStateEvalCriterion',
    'viewScoutableEvalCriterion',
    'xPatientsAtStatusEvalCriterion',
] satisfies BoolEvalCriterionType[];

export type NumberEvalCriterionType = NumberEvalCriterion['criterionType'];
export const numberEvalCriterionTypes = [
    'constNumEvalCriterion',
    'countPatientsAtStatusEvalCriterion',
    'countCompletedEvalCriterion',
    'firstTrueAtEvalCriterion',
    'timeStampEvalCriterion',
] satisfies NumberEvalCriterionType[];

export type EvalCriterionType = EvalCriterion['criterionType'];
export const combinedEvalCriterionTypes = [
    'andEvalCriterion',
    'orEvalCriterion',
    'countCompletedEvalCriterion',
    'notEvalCriterion',
    'firstTrueAtEvalCriterion',
    'greaterThanEvalCriterion',
] satisfies EvalCriterionType[];

export type EvalcriterionType = BoolEvalCriterionType | NumberEvalCriterionType;

/* Results of criteria with one of these criteriaTypes can not be calculated from the ExerciseState alone. Previous results with this type need to be cached in the respective exercise services. */
export const temporalEvalCriterionTypes = [
    'firstTrueAtEvalCriterion',
] satisfies EvalCriterionType[];
export const temporalEvalCriterionSchema = z.discriminatedUnion(
    'criterionType',
    [firstTrueAtEvalCriterionSchema]
);
export function isTemporalEvalCriterionType(
    evalCriterionType: EvalCriterionType
): boolean {
    for (const temporalEvalCriterionType of temporalEvalCriterionTypes) {
        if (evalCriterionType === temporalEvalCriterionType) {
            return true;
        }
    }
    return false;
}
export type TemporalEvalCriterion = z.infer<typeof temporalEvalCriterionSchema>;

/* TODO @JohannesPotzi @Jogius : To be revised. */
export const evalCriterionTypesNames: {
    [key in EvalcriterionType]: string;
} = {
    doMeasureXTimesEvalCriterion: 'Maßnahme X Mal',
    reachTechnicalChallengeStateEvalCriterion:
        'Zustand Technischer Herausforderung',
    patientAtStatusEvalCriterion: 'Patient mit SK',
    xPatientsAtStatusEvalCriterion: 'X Patienten mit SK',
    viewScoutableEvalCriterion: 'Erkundung auf der Karte',
    orEvalCriterion: 'Oder-Kriterium',
    andEvalCriterion: 'Und-Kriterium',
    constNumEvalCriterion: 'Konstante Zahl',
    countCompletedEvalCriterion: 'Anzahl erfüllter Kriterien',
    greaterThanEvalCriterion: 'Mindest-Anzahl Kriterium',
    notEvalCriterion: 'Negation',
    timeStampEvalCriterion: 'Zeitpunkt',
    firstTrueAtEvalCriterion: 'Zeitpunkt von Kriterium Erfüllung',
    countPatientsAtStatusEvalCriterion: 'Anzahl von Patienten mit Status',
} as const;
export function newAndEvalCriterion(
    name: string,
    children?: BoolEvalCriterionId[]
): AndEvalCriterion {
    return {
        id: uuid() as EvalCriterionId,
        name,
        type: 'evalCriterion',
        criterionType: 'andEvalCriterion',
        children: children ?? [],
    };
}
export function newOrEvalCriterion(
    name: string,
    children?: BoolEvalCriterionId[]
): OrEvalCriterion {
    return {
        id: uuid() as EvalCriterionId,
        name,
        type: 'evalCriterion',
        criterionType: 'orEvalCriterion',
        children: children ?? [],
    };
}
export function newNotEvalCriterion(
    name: string,
    child: BoolEvalCriterionId
): NotEvalCriterion {
    return {
        id: uuid() as EvalCriterionId,
        name,
        type: 'evalCriterion',
        criterionType: 'notEvalCriterion',
        child,
    };
}
export function newGreaterThanEvalCriterion(
    name: string,
    leftChild: NumberEvalCriterionId,
    rightChild: NumberEvalCriterionId
): GreaterThanEvalCriterion {
    return {
        id: uuid() as EvalCriterionId,
        name,
        type: 'evalCriterion',
        criterionType: 'greaterThanEvalCriterion',
        leftChild,
        rightChild,
    };
}
export function newConstNumEvalCriterion(
    name: string,
    num: number
): ConstNumEvalCriterion {
    return {
        id: uuid() as EvalCriterionId,
        name,
        type: 'evalCriterion',
        criterionType: 'constNumEvalCriterion',
        num,
    };
}
export function newCountCompletedEvalCriterion(
    name: string,
    children: BoolEvalCriterionId[]
): CountCompletedEvalCriterion {
    return {
        id: uuid() as EvalCriterionId,
        name,
        type: 'evalCriterion',
        criterionType: 'countCompletedEvalCriterion',
        num: -1,
        children,
    };
}
export function newFirstTrueAtEvalCriterion(
    name: string,
    child: BoolEvalCriterionId
): FirstTrueAtEvalCriterion {
    return {
        id: uuid() as EvalCriterionId,
        name,
        type: 'evalCriterion',
        criterionType: 'firstTrueAtEvalCriterion',
        num: -1,
        child,
    };
}
export function newTimeStampEvalCriterion(
    name: string,
    num: number
): TimeStampEvalCriterion {
    return {
        id: uuid() as EvalCriterionId,
        name,
        type: 'evalCriterion',
        criterionType: 'timeStampEvalCriterion',
        num,
    };
}
export function newDoMeasureXTimesEvalCriterion(
    name: string,
    targetCount: number,
    targetMeasureId: UUID
): DoMeasureXTimesEvalCriterion {
    return {
        id: uuid() as EvalCriterionId,
        name,
        type: 'evalCriterion',
        criterionType: 'doMeasureXTimesEvalCriterion',
        targetCount,
        targetMeasureId,
    };
}
export function newReachTechnicalChallengeStateEvalCriterion(
    name: string,
    targetTechnicalChallengeId: TechnicalChallengeId,
    targetTechnicalChallengeStateId: TechnicalChallengeStateId
): ReachTechnicalChallengeStateEvalCriterion {
    return {
        id: uuid() as EvalCriterionId,
        name,
        type: 'evalCriterion',
        criterionType: 'reachTechnicalChallengeStateEvalCriterion',
        targetTechnicalChallengeId,
        targetTechnicalChallengeStateId,
    };
}
export function newPatientAtStatusEvalCriterion(
    name: string,
    targetPatientId: UUID,
    targetStatus: PatientStatus
): PatientAtStatusEvalCriterion {
    return {
        id: uuid() as EvalCriterionId,
        name,
        type: 'evalCriterion',
        criterionType: 'patientAtStatusEvalCriterion',
        targetPatientId,
        targetStatus,
    };
}
export function newXPatientsAtStatusEvalCriterion(
    name: string,
    targetCount: number,
    targetStatus: PatientStatus
): XPatientsAtStatusEvalCriterion {
    return {
        id: uuid() as EvalCriterionId,
        name,
        type: 'evalCriterion',
        criterionType: 'xPatientsAtStatusEvalCriterion',
        targetCount,
        targetStatus,
    };
}
export function newViewScoutableEvalCriterion(
    name: string,
    targetScoutableId: UUID
): ViewScoutableEvalCriterion {
    return {
        id: uuid() as EvalCriterionId,
        name,
        type: 'evalCriterion',
        criterionType: 'viewScoutableEvalCriterion',
        targetScoutableId,
    };
}
export function isNumberEvalCriterion(
    criterion: EvalCriterion
): criterion is NumberEvalCriterion {
    return numberEvalCriterionTypes.includes(
        //@ts-expect-error: not assignable
        criterion.criterionType
    );
}
export function isBoolEvalCriterion(
    criterion: EvalCriterion
): criterion is BoolEvalCriterion {
    //@ts-expect-error: not assignable
    return boolEvalCritrionTypes.includes(criterion.criterionType);
}
/* TypeScript and Angular don't understand, that isNumberEvalCriterion(criterion)===true also means that criterion.num exists.*/
export function getNumFromEvalCriterion(
    criterion: EvalCriterion
): number | null {
    if (isNumberEvalCriterion(criterion)) {
        return criterion.num;
    }
    return null;
}
/**
 * recursively removes the childCriteria of an initial eval criterion from the input map
 * @param criteriaMap
 * @param currentCriterion
 * @returns a the modified input map, without the children criteria of the specified criterion
 */
export function removeChildren(
    criteriaMapIn: { [key: EvalCriterionId]: EvalCriterion | null },
    currentCriterion?: EvalCriterion
): { [key: EvalCriterionId]: EvalCriterion | null } {
    if (!currentCriterion) {
        return criteriaMapIn;
    }
    if (!criteriaMapIn[currentCriterion.id]) {
        console.log(
            '[logic Error] When filtering root criteria, the current criterion was not in the criteria.'
        );
        return criteriaMapIn;
    }
    let criteriaMap = criteriaMapIn as {
        [key: EvalCriterionId]: EvalCriterion | null;
    };
    const type = currentCriterion.criterionType;
    if (
        type === 'andEvalCriterion' ||
        type === 'orEvalCriterion' ||
        type === 'countCompletedEvalCriterion'
    ) {
        for (let i = 0; i < currentCriterion.children.length; i += 1) {
            let criterion = criteriaMap[currentCriterion.children.at(i)!];
            if (criterion) {
                removeChildren(criteriaMap, criterion);
                criterion = null;
            }
        }
    }
    if (type === 'firstTrueAtEvalCriterion' || type === 'notEvalCriterion') {
        let criterion = criteriaMap[currentCriterion.child];
        if (criterion) {
            removeChildren(criteriaMap, criterion);
            criterion = null;
        }
    }
    if (type === 'greaterThanEvalCriterion') {
        let leftCriterion = criteriaMap[currentCriterion.leftChild];
        let rightCriterion = criteriaMap[currentCriterion.rightChild];
        if (leftCriterion) {
            removeChildren(criteriaMap, leftCriterion);
            leftCriterion = null;
        }
        if (rightCriterion) {
            removeChildren(criteriaMap, rightCriterion);
            rightCriterion = null;
        }
    }
    return criteriaMap;
}
export function getRootCriteriaMap(criteriaMap: {
    [crtierionId: UUID]: EvalCriterion;
}): {
    [CriterionId: UUID]: EvalCriterion;
} {
    const criteria = Object.values(criteriaMap);
    let tmpMap = criteriaMap;
    for (const criterion of criteria) {
        if (isCombinedEvalCriterion(criterion)) {
            tmpMap = Object.values(
                removeChildren(criteriaMap, criterion)
            ).reduce<{ [key: EvalCriterionId]: EvalCriterion }>((obj, crit) => {
                if (crit) {
                    obj[crit.id] = crit;
                }
                return obj;
            }, {});
        }
    }
    return tmpMap;
}

export function isCombinedEvalCriterion(evalCriterion: EvalCriterion) {
    return combinedEvalCriterionTypes.includes(
        //@ts-expect-error: not assignable
        evalCriterion.criterionType
    );
}

/* TODO @JohannesPotzi @Jogius : refactor this after all criteria have their files and all the mappings are done. */
export function getChildrenOfEvalCriterion(
    criterion: EvalCriterion,
    criteriaMap: { [citerionId: EvalCriterionId]: EvalCriterion }
): EvalCriterion[] {
    if (isCombinedEvalCriterion(criterion)) {
        const type = criterion.criterionType;
        if (
            type === 'andEvalCriterion' ||
            type === 'orEvalCriterion' ||
            type === 'countCompletedEvalCriterion'
        ) {
            return criterion.children
                .filter((id) => criteriaMap[id])
                .map((id) => criteriaMap[id]!);
        }
        if (
            type === 'firstTrueAtEvalCriterion' ||
            type === 'notEvalCriterion'
        ) {
            return [criteriaMap[criterion.child]!];
        }
        if (type === 'greaterThanEvalCriterion') {
            return [
                criteriaMap[criterion.leftChild]!,
                criteriaMap[criterion.rightChild]!,
            ];
        }
    }
    return [] as EvalCriterion[];
}
export function getEvalCriterionTreeDepth(
    criterion: EvalCriterion,
    criteriaMap: { [citerionId: EvalCriterionId]: EvalCriterion }
): number {
    const children = getChildrenOfEvalCriterion(criterion, criteriaMap);
    if (children.length === 0) {
        return 1;
    }
    const childDepths = children.map((child) =>
        getEvalCriterionTreeDepth(child, criteriaMap)
    );
    return Math.max(...childDepths) + 1;
}

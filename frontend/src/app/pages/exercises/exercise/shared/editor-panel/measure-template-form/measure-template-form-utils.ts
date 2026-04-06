import type {
    MeasureProperty,
    MeasurePropertyType,
} from 'fuesim-digital-shared';

export interface EditableMeasureTemplateValues {
    name: string;
    properties: EditableMeasureProperty[];
}

export interface MeasureTemplateValues {
    name: string;
    properties: MeasureProperty[];
}

export interface EditableAlarmProperty {
    type: 'alarm';
    alarmGroups: string[];
    targetTransferPointIds: string[];
}

export interface EditableDelayProperty {
    type: 'delay';
    delay: number | null;
}

export interface EditableEocLogProperty {
    type: 'eocLog';
    message: string;
}

export interface EditableResponseProperty {
    type: 'response';
    response: string;
}

export interface EditableManualConfirmProperty {
    type: 'manualConfirm';
    prompt: string;
    confirmationString: string;
}

export type EditableMeasureProperty =
    | EditableAlarmProperty
    | EditableDelayProperty
    | EditableEocLogProperty
    | EditableManualConfirmProperty
    | EditableResponseProperty;

export const emptyPropertyDefaults: {
    [Key in MeasurePropertyType]: EditableMeasureProperty;
} = {
    manualConfirm: {
        type: 'manualConfirm',
        prompt: '',
        confirmationString: '',
    },
    response: { type: 'response', response: '' },
    delay: { type: 'delay', delay: null },
    alarm: { type: 'alarm', alarmGroups: [], targetTransferPointIds: [] },
    eocLog: { type: 'eocLog', message: '' },
};

export function preprocessProperty(property: EditableMeasureProperty): unknown {
    switch (property.type) {
        case 'manualConfirm':
            return {
                ...property,
                confirmationString:
                    property.confirmationString.trim() || undefined,
            };
        case 'eocLog':
            return {
                ...property,
                message: property.message.trim() || undefined,
            };
        default:
            return property;
    }
}

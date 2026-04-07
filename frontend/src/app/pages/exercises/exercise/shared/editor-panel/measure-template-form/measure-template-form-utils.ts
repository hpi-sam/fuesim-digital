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

export interface EditableDrawFreehandProperty {
    type: 'drawFreehand';
    strokeColor: string;
    fillColor: string;
}

export interface EditableDrawLineProperty {
    type: 'drawLine';
    strokeColor: string;
}

export type EditableMeasureProperty =
    | EditableAlarmProperty
    | EditableDelayProperty
    | EditableDrawFreehandProperty
    | EditableDrawLineProperty
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
    drawFreehand: {
        type: 'drawFreehand',
        strokeColor: '#000000',
        fillColor: '#ff0000',
    },
    drawLine: { type: 'drawLine', strokeColor: '#000000' },
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

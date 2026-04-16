import {
    measurePropertyTypeToDefaultHint,
    type MeasureProperty,
    type MeasurePropertyType,
} from 'fuesim-digital-shared';

export interface EditableMeasureTemplateValues {
    name: string;
    properties: EditableMeasureProperty[];
    categoryName: string;
    replacePrevious: boolean;
}

export interface MeasureTemplateValues {
    name: string;
    properties: MeasureProperty[];
    categoryName: string;
    replacePrevious: boolean;
}

export interface EditableAlarmProperty {
    type: 'alarm';
    hint: string;
    alarmGroups: string[];
    targetTransferPointIds: string[];
}

export interface EditableDelayProperty {
    type: 'delay';
    hint: string;
    delay: number | null;
}

export interface EditableEocLogProperty {
    type: 'eocLog';
    hint: string;
    message: string;
    editable: boolean;
    confirm: boolean;
}

export interface EditableResponseProperty {
    type: 'response';
    hint: string;
    response: string;
}

export interface EditableManualConfirmProperty {
    type: 'manualConfirm';
    hint: string;
    prompt: string;
    confirmationString: string;
}

export interface EditableDrawFreehandProperty {
    type: 'drawFreehand';
    hint: string;
    strokeColor: string;
    fillColor: string;
}

export interface EditableDrawLineProperty {
    type: 'drawLine';
    hint: string;
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
        hint: measurePropertyTypeToDefaultHint.manualConfirm,
        prompt: '',
        confirmationString: '',
    },
    response: {
        type: 'response',
        hint: measurePropertyTypeToDefaultHint.response,
        response: '',
    },
    delay: {
        type: 'delay',
        hint: measurePropertyTypeToDefaultHint.delay,
        delay: null,
    },
    alarm: {
        type: 'alarm',
        hint: measurePropertyTypeToDefaultHint.alarm,
        alarmGroups: [],
        targetTransferPointIds: [],
    },
    eocLog: {
        type: 'eocLog',
        hint: measurePropertyTypeToDefaultHint.eocLog,
        message: '',
        editable: true,
        confirm: true,
    },
    drawFreehand: {
        type: 'drawFreehand',
        hint: measurePropertyTypeToDefaultHint.drawFreehand,
        strokeColor: '#000000',
        fillColor: '#ff0000',
    },
    drawLine: {
        type: 'drawLine',
        hint: measurePropertyTypeToDefaultHint.drawLine,
        strokeColor: '#000000',
    },
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

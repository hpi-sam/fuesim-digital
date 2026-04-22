import {
    measurePropertyTypeToDefaultHint,
    type MeasureProperty,
    type MeasurePropertyType,
} from 'fuesim-digital-shared';

export interface MeasureTemplateValues {
    name: string;
    properties: MeasureProperty[];
    categoryName: string;
    replacePrevious: boolean;
}

export const emptyPropertyDefaults: {
    [Key in MeasurePropertyType]: Extract<MeasureProperty, { type: Key }>;
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
        delay: 60,
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

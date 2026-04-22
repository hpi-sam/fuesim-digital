import type {
    MeasureTemplate,
    MeasureTemplateCategory,
} from '../../models/measure/measures.js';

const alarmMeasureTemplate: MeasureTemplate = {
    id: 'cfc7238d-d468-46a8-bb99-12cbc9dafe67',
    name: 'Stichworterhöhung',
    properties: [
        {
            type: 'delay',
            hint: 'Bitte warten Sie auf die Antwort der Leitstelle …',
            delay: 30,
        },
        {
            type: 'alarm',
            hint: '',
            alarmGroups: [],
            targetTransferPointIds: [],
        },
    ],
    replacePrevious: false,
};

const customEocLogMeasureTemplate: MeasureTemplate = {
    id: '3468d25c-191e-41dd-b381-f657e449004a',
    name: 'Kurzmeldung abgeben',
    properties: [
        {
            type: 'eocLog',
            hint: '',
            message: undefined,
            editable: true,
            confirm: true,
        },
    ],
    replacePrevious: false,
};

const dangerZoneMeasureTemplate: MeasureTemplate = {
    id: 'af38a9b0-d61e-4a64-8413-4bbd5e133932',
    name: 'Gefahrenbereich einzeichnen',
    properties: [
        {
            type: 'drawFreehand',
            hint: 'Gedrückt halten und Bereich einzeichnen …',
            fillColor: '#ff7300',
            strokeColor: '#ff0000',
        },
    ],
    replacePrevious: true,
};

const closureMeasureTemplate: MeasureTemplate = {
    id: 'b289c081-9c04-4682-9bef-c97e25cccac3',
    name: 'Absperrung anordnen',
    properties: [
        {
            type: 'drawLine',
            hint: 'Durch einzelnes Tippen Punkte platzieren …',
            strokeColor: '#0d00ff',
        },
        {
            type: 'delay',
            hint: 'Auf Ausführung durch Polizei warten …',
            delay: 30,
        },
    ],
    replacePrevious: false,
};

export const defaultMeasureTemplates = {
    alarm: alarmMeasureTemplate,
    customEocLog: customEocLogMeasureTemplate,
    dangerZone: dangerZoneMeasureTemplate,
    closure: closureMeasureTemplate,
} as const;

export const defaultMeasureTemplatesById = Object.fromEntries(
    Object.values(defaultMeasureTemplates).map((template) => [
        template.id,
        template,
    ])
);

export const defaultMeasureTemplateCategories: {
    [key: string]: MeasureTemplateCategory;
} = {
    Maßnahmen: {
        name: 'Maßnahmen',
        templates: defaultMeasureTemplatesById,
    },
};

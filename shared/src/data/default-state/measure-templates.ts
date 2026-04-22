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

export const defaultMeasureTemplates = {
    alarm: alarmMeasureTemplate,
    customEocLog: customEocLogMeasureTemplate,
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

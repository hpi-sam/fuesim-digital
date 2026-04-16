import type {
    MeasureTemplate,
    MeasureTemplateCategory,
} from '../../models/measure/measures.js';
import { defaultAlarmGroups } from './vehicle-templates.js';

const askBystanderMeasureTemplate: MeasureTemplate = {
    id: '1b9ba0c3-e50e-481d-9897-443cbf0175b5',
    name: 'Schaulustigen fragen: Wie ist der Unfall passiert?',
    properties: [
        {
            type: 'manualConfirm',
            hint: 'Bitte jetzt bestätigen',
            prompt: 'Möchten Sie wirklich den Schaulustigen fragen?',
        },
        {
            type: 'delay',
            hint: 'Bitte warten Sie 5 Sekunden',
            delay: 5,
        },
        {
            type: 'response',
            hint: 'Bitte bestätigen Sie die Antwort',
            response: 'Das weiß ich auch nicht so genau.',
        },
    ],
};

const responseMeasureTemplate: MeasureTemplate = {
    id: '82c5b3d3-0e65-4724-bc75-9d2aefe39a4b',
    name: 'Antwort erbitten',
    properties: [
        {
            type: 'response',
            hint: 'Jetzt Antwort bestätigen',
            response: 'Die bekommst du gerne.',
        },
    ],
};

const alarmMeasureTemplate: MeasureTemplate = {
    id: 'cfc7238d-d468-46a8-bb99-12cbc9dafe67',
    name: 'Nachalarmieren',
    properties: [
        {
            type: 'delay',
            hint: 'Bitte warten Sie',
            delay: 1,
        },
        {
            type: 'alarm',
            hint: 'Jetzt Alarmgruppe und Transferpunkt auswählen',
            alarmGroups: [
                ...Object.values(defaultAlarmGroups).map((v) => v.id),
            ],
            targetTransferPointIds: [],
        },
    ],
};

const alarmRtwMeasureTemplate: MeasureTemplate = {
    id: '0f6e03bc-95d1-4c8d-aecd-e5101e7a1895',
    name: 'RTW Nachalarmieren',
    properties: [
        {
            type: 'delay',
            hint: 'Bitte warten Sie',
            delay: 1,
        },
        {
            type: 'alarm',
            hint: 'Jetzt Transferpunkt auswählen',
            alarmGroups: [defaultAlarmGroups.rtw.id],
            targetTransferPointIds: [],
        },
    ],
};

const predefinedEocLogMeasureTemplate: MeasureTemplate = {
    id: '70a0b93a-ba24-46a1-8018-3f7933bb0ae7',
    name: 'Leitstelle über Verletzte informieren',
    properties: [
        {
            type: 'eocLog',
            hint: 'Bitte Einsatztagebucheintrag bestätigen',
            message: 'Die Patienten sind alle gesund.',
            editable: false,
            confirm: true,
        },
    ],
};

const customEocLogMeasureTemplate: MeasureTemplate = {
    id: '3468d25c-191e-41dd-b381-f657e449004a',
    name: 'Einsatztagebucheintrag erstellen',
    properties: [
        {
            type: 'eocLog',
            hint: 'Jetzt eigenen Einsatztagebucheintrag verfassen',
            message: undefined,
            editable: true,
            confirm: true,
        },
    ],
};

export const defaultMeasureTemplates = {
    askBystander: askBystanderMeasureTemplate,
    response: responseMeasureTemplate,
    alarm: alarmMeasureTemplate,
    alarmRtw: alarmRtwMeasureTemplate,
    predefinedEocLog: predefinedEocLogMeasureTemplate,
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

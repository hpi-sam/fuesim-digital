import type { MeasureTemplate } from '../../models/measure/index.js';
import { cloneDeepImmutable } from '../../utils/clone-deep.js';

const askBystanderMeasureTemplate: MeasureTemplate = cloneDeepImmutable({
    id: '1b9ba0c3-e50e-481d-9897-443cbf0175b5',
    name: 'Schaulustigen fragen: Wie ist der Unfall passiert?',
    image: {
        url: '',
        height: 1,
        aspectRatio: 1,
    },
    properties: [
        {
            type: 'manualConfirm',
            prompt: 'Möchten Sie wirklich den Schaulustigen fragen?',
        },
        {
            type: 'delay',
            delay: 5,
        },
        {
            type: 'response',
            response: 'Das weiß ich auch nicht so genau.',
        },
    ],
});

const responseMeasureTemplate: MeasureTemplate = cloneDeepImmutable({
    id: '82c5b3d3-0e65-4724-bc75-9d2aefe39a4b',
    name: 'Antwort erbitten',
    image: {
        url: '',
        height: 1,
        aspectRatio: 1,
    },
    properties: [
        {
            type: 'response',
            response: 'Die bekommst du gerne.',
        },
    ],
});

export const defaultMeasureTemplates = {
    askBystander: askBystanderMeasureTemplate,
    response: responseMeasureTemplate,
} as const;

export const defaultMeasureTemplatesById = Object.fromEntries(
    Object.values(defaultMeasureTemplates).map((template) => [
        template.id,
        template,
    ])
);

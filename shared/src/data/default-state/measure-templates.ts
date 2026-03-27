import type { MeasureTemplate } from '../../models/global-measure.js';
import { cloneDeepImmutable } from '../../utils/clone-deep.js';

const responseMeasureTemplate: MeasureTemplate = cloneDeepImmutable({
    id: '1b9ba0c3-e50e-481d-9897-443cbf0175b5',
    name: 'Random Antwort',
    image: {
        url: '',
        height: 1,
        aspectRatio: 1,
    },
    properties: [
        {
            type: 'response',
            response: 'Das ist eine unwichtige Antwort.',
            requires: [],
            blockedBy: [],
        },
    ],
});

export const defaultMeasureTemplates = {
    response: responseMeasureTemplate,
} as const;

export const defaultMeasureTemplatesById = Object.fromEntries(
    Object.values(defaultMeasureTemplates).map((template) => [
        template.id,
        template,
    ])
);

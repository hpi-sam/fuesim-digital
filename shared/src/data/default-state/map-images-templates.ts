import { MapImageTemplate, newImageProperties } from '../../models/index.js';
import type { UUID } from '../../utils/index.js';

const fireMapImageTemplate = MapImageTemplate.create(
    'Feuer',
    newImageProperties('/assets/fire.svg', 427, 313 / 427)
);

const houseFireMapImageTemplate = MapImageTemplate.create(
    'Brennendes Haus',
    newImageProperties('/assets/house-fire.svg', 623, 393 / 623)
);

export const defaultMapImagesTemplates: readonly MapImageTemplate[] = [
    fireMapImageTemplate,
    houseFireMapImageTemplate,
];

export const defaultMapImagesTemplatesById: {
    [key in UUID]: MapImageTemplate;
} = Object.fromEntries(
    defaultMapImagesTemplates.map((template) => [template.id, template])
);

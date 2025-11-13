import { MapImageTemplate } from '../../models/index.js';
import type { UUID } from '../../utils/index.js';

const fireMapImageTemplate = MapImageTemplate.create('Feuer', {
    url: '/assets/fire.svg',
    height: 427,
    aspectRatio: 313 / 427,
});

const houseFireMapImageTemplate = MapImageTemplate.create('Brennendes Haus', {
    url: '/assets/house-fire.svg',
    height: 623,
    aspectRatio: 393 / 623,
});

export const defaultMapImagesTemplates: readonly MapImageTemplate[] = [
    fireMapImageTemplate,
    houseFireMapImageTemplate,
];

export const defaultMapImagesTemplatesById: {
    [key in UUID]: MapImageTemplate;
} = Object.fromEntries(
    defaultMapImagesTemplates.map((template) => [template.id, template])
);

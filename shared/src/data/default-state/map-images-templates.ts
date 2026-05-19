import type { MapImageTemplate } from '../../models/map-image-template.js';
import { newImageProperties } from '../../models/utils/image-properties.js';
import type { UUID } from '../../utils/uuid.js';
import { scoutableImages } from '../../models/scoutable.js';

const fireMapImageTemplate: MapImageTemplate = {
    id: '47df49cf-3769-43c8-bfb2-87c6d3a43baa',
    type: 'mapImageTemplate',
    name: 'Feuer',
    image: newImageProperties('/assets/fire.svg', 427, 313 / 427),
};

const houseFireMapImageTemplate: MapImageTemplate = {
    id: 'c8847e93-3462-4d94-82af-2b0d7e82ae46',
    type: 'mapImageTemplate',
    name: 'Brennendes Haus',
    image: newImageProperties('/assets/house-fire.svg', 623, 393 / 623),
};

export const scoutableMapImageTemplate: MapImageTemplate = {
    id: '5661183e-a7c0-4e3a-82f4-29c6b6b6d866',
    type: 'mapImageTemplate',
    name: 'Erkundung',
    image: newImageProperties(scoutableImages.unviewed.generic, 50, 1),
};

export const defaultMapImagesTemplates: readonly MapImageTemplate[] = [
    fireMapImageTemplate,
    houseFireMapImageTemplate,
];

export const defaultMapImagesTemplatesById: {
    [key in UUID]: MapImageTemplate;
} = Object.fromEntries(
    defaultMapImagesTemplates.map((template) => [template.id, template])
);

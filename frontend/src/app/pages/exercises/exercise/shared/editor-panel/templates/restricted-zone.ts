import type {
    ExerciseState,
    ImageProperties,
    RestrictedZone,
} from 'fuesim-digital-shared';
import {
    cloneDeepMutable,
    defaultVehicleTemplates,
    newNoPosition,
    restrictedZoneImage,
    uuid,
} from 'fuesim-digital-shared';
import { toUtf8Base64 } from './utils/base64';

export interface RestrictedZoneDragTemplate {
    image: ImageProperties;
    stereotype: RestrictedZone;
    editorName: string;
}

const height = restrictedZoneImage.height / 23.5;
const width = height * restrictedZoneImage.aspectRatio;
const size = {
    height,
    width,
};
const position = newNoPosition();

const stereotypes: RestrictedZone[] = [
    {
        type: 'restrictedZone',
        id: '',
        name: 'Eingeschränkte Zone ???',
        color: '#ff4444',
        capacity: 5,
        vehicleRestrictions: {},
        position,
        size,
        nameVisible: true,
        capacityVisible: true,
    },
    {
        type: 'restrictedZone',
        id: '',
        name: 'Ladezone ???',
        color: '#00ff00',
        capacity: 3,
        vehicleRestrictions: {
            [defaultVehicleTemplates.carryingUnit.id]: 'ignore',
        },
        position,
        size,
        nameVisible: true,
        capacityVisible: true,
    },
    {
        type: 'restrictedZone',
        id: '',
        name: 'Pufferzone ???',
        color: '#ffff00',
        capacity: 5,
        vehicleRestrictions: {},
        position,
        size,
        nameVisible: true,
        capacityVisible: true,
    },
    {
        type: 'restrictedZone',
        id: '',
        name: 'RTH-Landeplatz ???',
        color: '#ff8800',
        capacity: 1,
        vehicleRestrictions: {
            [defaultVehicleTemplates.rth.id]: 'restrict',
            [defaultVehicleTemplates.rtw.id]: 'prohibit',
            [defaultVehicleTemplates.naw.id]: 'prohibit',
            [defaultVehicleTemplates.nef.id]: 'prohibit',
            [defaultVehicleTemplates.ktw.id]: 'prohibit',
            [defaultVehicleTemplates.ktwKatSchutz.id]: 'prohibit',
            [defaultVehicleTemplates.gwSan.id]: 'prohibit',
            [defaultVehicleTemplates.carryingUnit.id]: 'prohibit',
        },
        position,
        size: { width: 50, height: 50 },
        nameVisible: true,
        capacityVisible: true,
    },
];

function coloredImageUrl(color: string, name: string): ImageProperties {
    const cleanedName = name.replace(/\s*\?{3}$/u, '');
    const escapedName = cleanedName
        .replace(/&/gu, '&amp;')
        .replace(/</gu, '&lt;')
        .replace(/>/gu, '&gt;')
        .replace(/"/gu, '&quot;')
        .replace(/'/gu, '&#39;');

    const content = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <svg
       width="161"
       height="91"
       viewBox="0 0 42.597916 24.077084"
       version="1.1"
       xmlns="http://www.w3.org/2000/svg">
      <rect
         style="fill:${color};stroke-width:0.5;fill-opacity:0.6;stroke:#000000;stroke-opacity:1;"
         width="42.263648"
         height="23.687329"
         x="0.159559"
         y="0.186193" />
      <text
         style="font-size:3px;text-anchor:middle;fill:#000000;font-family:Arial"
         x="21.298958"
         y="12.5">
         ${escapedName}
      </text>
    </svg>
    `;
    const url = `data:image/svg+xml;base64,${toUtf8Base64(content)}`;

    return {
        ...restrictedZoneImage,
        url,
    };
}

export const restrictedZoneDragTemplates: RestrictedZoneDragTemplate[] =
    stereotypes.map((stereotype) => ({
        stereotype,
        image: coloredImageUrl(stereotype.color, stereotype.name),
        editorName: stereotype.name.endsWith(' ???')
            ? stereotype.name.slice(0, -4)
            : stereotype.name,
    }));

export function reconstituteRestrictedZoneTemplate(
    template: RestrictedZone,
    state: ExerciseState
) {
    const zone = cloneDeepMutable(template);
    zone.id = uuid();
    return zone;
}

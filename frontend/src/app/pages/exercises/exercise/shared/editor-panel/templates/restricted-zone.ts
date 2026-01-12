import type {
    ExerciseState,
    ImageProperties,
    MapPosition,
} from 'digital-fuesim-manv-shared';
import {
    cloneDeepMutable,
    newMapPositionAt,
    RestrictedZone,
    uuid,
} from 'digital-fuesim-manv-shared';
import { toUtf8Base64 } from './utils/base64';

export interface RestrictedZoneDragTemplate {
    image: ImageProperties;
    stereotype: RestrictedZone;
}

const height = RestrictedZone.image.height / 23.5;
const width = height * RestrictedZone.image.aspectRatio;
const size = {
    height,
    width,
};
const position: MapPosition = newMapPositionAt({ x: 0, y: 0 });

const stereotypes: RestrictedZone[] = [
    {
        type: 'restrictedZone',
        id: '',
        name: 'Eingeschränkte Zone ???',
        color: '#ff4444',
        capacity: 5,
        vehicleIds: [],
        vehicleRestrictions: {},
        position,
        size,
    },
    {
        type: 'restrictedZone',
        id: '',
        name: 'Ladezone ???',
        color: '#00ff00',
        capacity: 3,
        vehicleIds: [],
        vehicleRestrictions: { Tragetrupp: 'ignore' },
        position,
        size,
    },
    {
        type: 'restrictedZone',
        id: '',
        name: 'Pufferzone ???',
        color: '#ffff00',
        capacity: 5,
        vehicleIds: [],
        vehicleRestrictions: {},
        position,
        size,
    },
    {
        type: 'restrictedZone',
        id: '',
        name: 'RTH-Landeplatz ???',
        color: '#ff8800',
        capacity: 1,
        vehicleIds: [],
        vehicleRestrictions: {
            RTH: 'restrict',
            RTW: 'prohibit',
            NAW: 'prohibit',
            NEF: 'prohibit',
            KTW: 'prohibit',
            'KTW (KatSchutz)': 'prohibit',
            'GW-San': 'prohibit',
            Tragetrupp: 'prohibit',
        },
        position,
        size: { width: 50, height: 50 },
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
        ...RestrictedZone.image,
        url,
    };
}

export const restrictedZoneDragTemplates: RestrictedZoneDragTemplate[] =
    stereotypes.map((stereotype) => ({
        stereotype,
        image: coloredImageUrl(stereotype.color, stereotype.name),
    }));

export function reconstituteRestrictedZoneTemplate(
    template: RestrictedZone,
    state: ExerciseState
) {
    const zone = cloneDeepMutable(template);
    zone.id = uuid();
    return zone;
}

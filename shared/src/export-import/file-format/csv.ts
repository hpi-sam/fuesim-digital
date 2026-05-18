import Papa from 'papaparse';
import { z } from 'zod';
import { toLonLat } from 'ol/proj.js';
import type { ExerciseState } from '../../state.js';
import type { Sex } from '../../models/utils/sex.js';
import type { PatientStatus } from '../../models/utils/patient-status.js';
import {
    coordinateStringSchema,
    coordinateStringToNumber,
} from '../../utils/string-coordinates.js';
import { isInViewport } from '../../models/viewport.js';
import {
    currentCoordinatesOf,
    isOnMap,
} from '../../models/utils/position/position-helpers.js';

const statusCodeToExportMap: { [key in PatientStatus]: string } = {
    red: '1',
    yellow: '2',
    green: '3',
    black: '1',
    blue: '1',
    white: '3',
} as const;
const statusToExport = z.string().transform(
    (statusCode) =>
        // @ts-expect-error: arbitrary string
        statusCodeToExportMap[statusCode] ?? '3'
);

const sexToExportMap: { [key in Sex]: string } = {
    male: 'M',
    female: 'W',
    diverse: '',
} as const;
const sexToExport = z.string().transform(
    // @ts-expect-error: string
    (sex) => sexToExportMap[sex] ?? ''
);

const boolToExport = z.boolean().transform((val) => {
    switch (val) {
        case true:
            return '1';
        case false:
            return '0';
        default:
            return '';
    }
});

const csvExportSchema = z.object({
    id: z.string(),
    status: statusToExport,
    sex: sexToExport,
    age: z.int().nonnegative(),
    pzc: z.literal(''),
    remarks: z.string(),
    hasTransportPriority: boolToExport,
    ventilated: z.literal(''),
    doctorEscort: z.literal(''),
    patientTray: z.literal(''),
    section: z.string(),
    latitude: z.union([coordinateStringSchema, z.literal('')]),
    longitude: z.union([coordinateStringSchema, z.literal('')]),
});
export type CSVExportType = z.infer<typeof csvExportSchema>;
export type CSVExportInput = z.input<typeof csvExportSchema>;
const csvExportListSchema = z.array(csvExportSchema);

export const patientsCsvExportColumns = [
    'ID',
    'SK',
    'Geschlecht',
    'Alter',
    'PZC',
    'Bemerkungen',
    'Transportpriorität',
    'Beatmet',
    'Arztbegleitung',
    'Patientenablage',
    'Abschnitt',
    'Breitengrad',
    'Laengengrad',
];

export function preparePatientsForCSVExport(state: ExerciseState) {
    const sortedViewports = Object.values(state.viewports).sort(
        (a, b) => a.size.width * a.size.height - b.size.width * b.size.height
    );
    const patients = Object.values(state.patients).map(
        (patient): CSVExportInput => {
            let longitude = '';
            let latitude = '';
            let section = '';
            if (isOnMap(patient)) {
                const coords = currentCoordinatesOf(patient);
                const lonLat = toLonLat([coords.x, coords.y]);
                longitude = coordinateStringToNumber.encode(lonLat[0]!);
                latitude = coordinateStringToNumber.encode(lonLat[1]!);

                const viewport = sortedViewports.find((vp) =>
                    isInViewport(vp, coords)
                );
                if (viewport) {
                    section = viewport.name;
                }
            }
            return {
                id: patient.identifier,
                status:
                    patient.pretriageStatus === 'white'
                        ? patient.realStatus
                        : patient.pretriageStatus,
                sex: patient.biometricInformation.sex,
                age: patient.biometricInformation.age,
                pzc: '',
                remarks: patient.remarks,
                hasTransportPriority: patient.hasTransportPriority,
                ventilated: '',
                doctorEscort: '',
                patientTray: '',
                section,
                latitude,
                longitude,
            };
        }
    );
    return csvExportListSchema.parse(patients);
}
export function exportPatientsToCSV(state: ExerciseState) {
    return Papa.unparse(
        [
            Object.values(patientsCsvExportColumns),
            ...preparePatientsForCSVExport(state).map(Object.values),
        ],
        {
            delimiter: ';',
        }
    );
}

import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';
import type { ExerciseRadiogram } from 'fuesim-digital-shared';

const map: { [Key in ExerciseRadiogram['type']]: string } = {
    materialCountRadiogram: 'Anzahl an Material',
    missingTransferConnectionRadiogram: 'Es fehlt eine Transferverbindung',
    patientCountRadiogram: 'Anzahl an Patienten',
    personnelCountRadiogram: 'Anzahl an Personal',
    treatmentStatusRadiogram: 'Behandlungsstatus',
    vehicleCountRadiogram: 'Anzahl an Fahrzeugen',
    vehicleOccupationsRadiogram: 'Nutzung der Fahrzeuge',
    resourceRequestRadiogram: 'Anfrage nach Fahrzeugen',
    transferConnectionsRadiogram: 'Transferverbindungen',
    transferCountsRadiogram: 'Anzahl abtransportierter Patienten',
    transferCategoryCompletedRadiogram: 'Transport für SK abgeschlossen',
    newPatientDataRequestedRadiogram: 'Anfrage nach Patientenzahlen',
};

@Pipe({ name: 'humanReadableRadiogramType' })
export class HumanReadableRadiogramTypePipe implements PipeTransform {
    transform(value: ExerciseRadiogram['type']): string {
        return map[value];
    }
}

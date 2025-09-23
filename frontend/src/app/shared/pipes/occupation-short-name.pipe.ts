import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';
import type { ExerciseOccupationType } from 'digital-fuesim-manv-shared';

const occupationShortNamesDictionary: {
    [key in ExerciseOccupationType]: string;
} = {
    noOccupation: 'Keine Aufgabe',
    intermediateOccupation: 'Übergabe für nächste Nutzung',
    unloadingOccupation: 'Aussteigen',
    loadOccupation: 'Einsteigen',
    waitForTransferOccupation: 'Wartet auf Ausfahrt',
    patientTransferOccupation: 'Reserviert für Patiententransport',
};

@Pipe({
    name: 'occupationShortName',
    standalone: false,
})
export class OccupationShortNamePipe implements PipeTransform {
    transform(occupationType: ExerciseOccupationType | undefined): string {
        if (!occupationType) return '';

        return occupationShortNamesDictionary[occupationType];
    }
}

import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';
import type { ExerciseOccupationType } from 'digital-fuesim-manv-shared';

const occupationNamesDictionary: {
    [key in ExerciseOccupationType]: string;
} = {
    noOccupation: 'Das Fahrzeug wird nicht genutzt',
    intermediateOccupation: 'Das Fahrzeug wird gerade übergeben',
    unloadingOccupation: 'Das Fahrzeug wird gerade ausgeladen',
    loadOccupation: 'Das Fahrzeug wird gerade beladen',
    waitForTransferOccupation: 'Das Fahrzeug wartet auf den Transfer',
    patientTransferOccupation:
        'Das Fahrzeug ist für den Transport von Patienten ins Krankenhaus reserviert',
};

@Pipe({
    name: 'occupationName',
    standalone: false,
})
export class OccupationNamePipe implements PipeTransform {
    transform(occupationType: ExerciseOccupationType | undefined): string {
        if (!occupationType) return '';

        return occupationNamesDictionary[occupationType];
    }
}

import { Injectable } from '@angular/core';
import type { UUID } from 'fuesim-digital-shared';
import { Subject } from 'rxjs';

@Injectable()
export class SelectPatientService {
    public readonly patientSelected = new Subject<UUID>();

    public selectPatient(id: UUID) {
        this.patientSelected.next(id);
    }
}

import type { OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { PersonnelCountRadiogram } from 'digital-fuesim-manv-shared';
import type { UUID } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import type { AppState } from 'src/app/state/app.state';
import { createSelectRadiogram } from 'src/app/state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-radiogram-card-content-personnel-count',
    templateUrl: './radiogram-card-content-personnel-count.component.html',
    styleUrls: ['./radiogram-card-content-personnel-count.component.scss'],
    standalone: false,
})
export class RadiogramCardContentPersonnelCountComponent implements OnInit {
    @Input() radiogramId!: UUID;

    radiogram$!: Observable<PersonnelCountRadiogram>;

    readonly personnelCategories = [
        'notarzt',
        'notSan',
        'rettSan',
        'san',
        'gf',
    ] as const;

    constructor(private readonly store: Store<AppState>) {}

    ngOnInit(): void {
        this.radiogram$ = this.store.select(
            createSelectRadiogram<PersonnelCountRadiogram>(this.radiogramId)
        );
    }
}

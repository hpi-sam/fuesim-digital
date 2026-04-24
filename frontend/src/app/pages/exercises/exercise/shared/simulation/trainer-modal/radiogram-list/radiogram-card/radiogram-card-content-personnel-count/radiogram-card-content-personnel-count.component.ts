import type { OnInit } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { PersonnelCountRadiogram, UUID } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import type { AppState } from '../../../../../../../../../state/app.state';
import {
    selectPersonnelTemplates,
    createSelectRadiogram,
} from '../../../../../../../../../state/application/selectors/exercise.selectors';
import { ValuesPipe } from '../../../../../../../../../shared/pipes/values.pipe';

@Component({
    selector: 'app-radiogram-card-content-personnel-count',
    templateUrl: './radiogram-card-content-personnel-count.component.html',
    styleUrls: ['./radiogram-card-content-personnel-count.component.scss'],
    imports: [ValuesPipe, AsyncPipe],
})
export class RadiogramCardContentPersonnelCountComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);

    readonly radiogramId = input.required<UUID>();

    radiogram$!: Observable<PersonnelCountRadiogram>;

    public readonly personnelTemplates$ = this.store.select(
        selectPersonnelTemplates
    );

    ngOnInit(): void {
        this.radiogram$ = this.store.select(
            createSelectRadiogram<PersonnelCountRadiogram>(this.radiogramId())
        );
    }
}

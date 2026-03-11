import type { OnInit } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { MaterialCountRadiogram, UUID } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import type { AppState } from '../../../../../../../../../state/app.state';
import { createSelectRadiogram } from '../../../../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-radiogram-card-content-material-count',
    templateUrl: './radiogram-card-content-material-count.component.html',
    styleUrls: ['./radiogram-card-content-material-count.component.scss'],
    standalone: false,
})
export class RadiogramCardContentMaterialCountComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);

    readonly radiogramId = input.required<UUID>();

    capacity$!: Observable<{ green: number; yellow: number; red: number }>;

    ngOnInit(): void {
        this.capacity$ = this.store
            .select(createSelectRadiogram(this.radiogramId()))
            .pipe(
                map((radiogram) => {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { logicalOperator: _, ...c } = (
                        radiogram as MaterialCountRadiogram
                    ).materialForPatients;
                    return c;
                })
            );
    }
}

import type { OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { MaterialCountRadiogram } from 'digital-fuesim-manv-shared';
import type { UUID } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import type { AppState } from 'src/app/state/app.state';
import { createSelectRadiogram } from 'src/app/state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-radiogram-card-content-material-count',
    templateUrl: './radiogram-card-content-material-count.component.html',
    styleUrls: ['./radiogram-card-content-material-count.component.scss'],
    standalone: false,
})
export class RadiogramCardContentMaterialCountComponent implements OnInit {
    @Input() radiogramId!: UUID;

    capacity$!: Observable<{ green: number; yellow: number; red: number }>;

    constructor(private readonly store: Store<AppState>) {}

    ngOnInit(): void {
        this.capacity$ = this.store
            .select(createSelectRadiogram(this.radiogramId))
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

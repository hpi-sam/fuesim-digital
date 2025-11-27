import type { OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { UUID } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import type { AppState } from 'src/app/state/app.state';
import { createSelectSimulatedRegion } from 'src/app/state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-simulated-region-name',
    templateUrl: './simulated-region-name.component.html',
    styleUrls: ['./simulated-region-name.component.scss'],
    standalone: false,
})
export class SimulatedRegionNameComponent implements OnInit {
    @Input() simulatedRegionId!: UUID;

    name$!: Observable<string>;

    constructor(private readonly store: Store<AppState>) {}

    ngOnInit(): void {
        this.name$ = this.store
            .select(createSelectSimulatedRegion(this.simulatedRegionId))
            .pipe(map((simulatedRegion) => simulatedRegion.name));
    }
}

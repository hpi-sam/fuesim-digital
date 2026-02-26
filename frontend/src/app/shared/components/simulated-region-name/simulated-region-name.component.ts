import type { OnInit } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { UUID } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import type { AppState } from '../../../state/app.state';
import { createSelectSimulatedRegion } from '../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-simulated-region-name',
    templateUrl: './simulated-region-name.component.html',
    styleUrls: ['./simulated-region-name.component.scss'],
    standalone: false,
})
export class SimulatedRegionNameComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);

    readonly simulatedRegionId = input.required<UUID>();

    name$!: Observable<string>;

    ngOnInit(): void {
        this.name$ = this.store
            .select(createSelectSimulatedRegion(this.simulatedRegionId()))
            .pipe(map((simulatedRegion) => simulatedRegion.name));
    }
}

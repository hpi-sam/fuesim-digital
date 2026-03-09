import {
    OnInit,
    signal,
    Component,
    ViewEncapsulation,
    inject,
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import type { UUID } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import type { AppState } from '../../../../../../../state/app.state';
import { selectSimulatedRegions } from '../../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-simulated-regions-modal',
    templateUrl: './simulated-regions-modal.component.html',
    styleUrls: ['./simulated-regions-modal.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: false,
})
export class SimulatedRegionsModalComponent implements OnInit {
    readonly activeModal = inject(NgbActiveModal);
    readonly store = inject<Store<AppState>>(Store);

    simulatedRegionIds$!: Observable<UUID[]>;

    readonly currentSimulatedRegionId = signal<UUID | null>(null);

    ngOnInit(): void {
        this.simulatedRegionIds$ = this.store
            .select(selectSimulatedRegions)
            .pipe(map((simulatedRegions) => Object.keys(simulatedRegions)));
    }

    public close() {
        this.activeModal.close();
    }
}

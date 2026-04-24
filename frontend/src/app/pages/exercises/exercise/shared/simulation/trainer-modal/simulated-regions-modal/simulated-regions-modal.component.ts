import {
    OnInit,
    signal,
    Component,
    ViewEncapsulation,
    inject,
} from '@angular/core';
import {
    NgbActiveModal,
    NgbNav,
    NgbNavItem,
    NgbNavLink,
    NgbNavLinkBase,
    NgbNavContent,
    NgbNavOutlet,
} from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import type { UUID } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import type { AppState } from '../../../../../../../state/app.state';
import { selectSimulatedRegions } from '../../../../../../../state/application/selectors/exercise.selectors';
import { StartPauseButtonComponent } from '../../../../../../../shared/components/start-pause-button/start-pause-button.component';
import { RadiogramListComponent } from '../radiogram-list/radiogram-list.component';
import { SimulatedRegionNameComponent } from '../../../../../../../shared/components/simulated-region-name/simulated-region-name.component';
import { SimulatedRegionOverviewGeneralComponent } from '../overview/simulated-region-overview.component';

@Component({
    selector: 'app-simulated-regions-modal',
    templateUrl: './simulated-regions-modal.component.html',
    styleUrls: ['./simulated-regions-modal.component.scss'],
    encapsulation: ViewEncapsulation.None,
    imports: [
        StartPauseButtonComponent,
        RadiogramListComponent,
        NgbNav,
        NgbNavItem,
        NgbNavLink,
        NgbNavLinkBase,
        SimulatedRegionNameComponent,
        NgbNavContent,
        SimulatedRegionOverviewGeneralComponent,
        NgbNavOutlet,
        AsyncPipe,
    ],
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

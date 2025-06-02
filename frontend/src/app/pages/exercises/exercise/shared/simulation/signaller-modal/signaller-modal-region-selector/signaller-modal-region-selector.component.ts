import type { OnDestroy, OnInit } from '@angular/core';
import { Component, ViewChild } from '@angular/core';
import type { HotkeyLayer } from 'src/app/shared/services/hotkeys.service';
import {
    Hotkey,
    HotkeysService,
} from 'src/app/shared/services/hotkeys.service';
import type { Observable } from 'rxjs';
import { map, Subject, takeUntil } from 'rxjs';
import { Store } from '@ngrx/store';
import type { AppState } from 'src/app/state/app.state';
import { selectSimulatedRegions } from 'src/app/state/application/selectors/exercise.selectors';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import type { SearchableDropdownOption } from 'src/app/shared/components/searchable-dropdown/searchable-dropdown.component';
import {
    eocId,
    overviewId,
    SelectSignallerRegionService,
} from '../select-signaller-region.service';

@Component({
    selector: 'app-signaller-modal-region-selector',
    templateUrl: './signaller-modal-region-selector.component.html',
    styleUrls: ['./signaller-modal-region-selector.component.scss'],
    standalone: false,
})
export class SignallerModalRegionSelectorComponent
    implements OnInit, OnDestroy
{
    public simulatedRegionNames$!: Observable<SearchableDropdownOption[]>;

    private baseLayer!: HotkeyLayer;

    @ViewChild(NgbPopover, { static: true }) popover!: NgbPopover;

    public readonly switchSimulatedRegionHotkey = new Hotkey(
        'F2',
        false,
        () => {
            this.popover.open();
        }
    );
    public readonly openOverviewHotkey = new Hotkey('⇧ + F2', false, () => {
        this.selectOverview();
    });

    private readonly destroy$ = new Subject<void>();

    constructor(
        private readonly store: Store<AppState>,
        private readonly hotkeys: HotkeysService,
        public readonly selectRegionService: SelectSignallerRegionService
    ) {}

    ngOnInit() {
        this.simulatedRegionNames$ = this.store
            .select(selectSimulatedRegions)
            .pipe(
                map((simulatedRegions) => [
                    { key: eocId, name: 'Leitstelle' },
                    ...Object.entries(simulatedRegions)
                        .sort(([, regionA], [, regionB]) =>
                            regionA.name.localeCompare(regionB.name)
                        )
                        .map(([id, region]) => ({
                            key: id,
                            name: region.name,
                        })),
                ])
            );

        this.baseLayer = this.hotkeys.createLayer();
        this.baseLayer.addHotkey(this.switchSimulatedRegionHotkey);
        this.baseLayer.addHotkey(this.openOverviewHotkey);

        this.selectRegionService.selectedSimulatedRegion$
            .pipe(takeUntil(this.destroy$))
            .subscribe((id) => {
                document
                    .querySelector(
                        `#signaller-modal-simulated-region-tab-${id}`
                    )
                    ?.scrollIntoView({
                        behavior: 'smooth',
                    });
            });
    }

    ngOnDestroy() {
        this.hotkeys.removeLayer(this.baseLayer);
        this.destroy$.next();
    }

    public selectRegion(selectedRegion: SearchableDropdownOption) {
        this.selectRegionService.selectSimulatedRegion(selectedRegion.key);
    }

    public selectOverview() {
        this.selectRegionService.selectSimulatedRegion(overviewId);
    }
}

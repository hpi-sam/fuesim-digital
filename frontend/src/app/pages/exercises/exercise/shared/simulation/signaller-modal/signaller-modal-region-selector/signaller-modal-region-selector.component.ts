import type { OnDestroy, OnInit } from '@angular/core';
import { Component, viewChild, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map, Subject, takeUntil } from 'rxjs';
import { Store } from '@ngrx/store';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import {
    eocId,
    overviewId,
    SelectSignallerRegionService,
} from '../select-signaller-region.service';
import type { HotkeyLayer } from '../../../../../../../shared/services/hotkeys.service';
import {
    Hotkey,
    HotkeysService,
} from '../../../../../../../shared/services/hotkeys.service';
import { SearchableDropdownOption } from '../../../../../../../shared/components/searchable-dropdown/searchable-dropdown.component';
import type { AppState } from '../../../../../../../state/app.state';
import { selectSimulatedRegions } from '../../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-signaller-modal-region-selector',
    templateUrl: './signaller-modal-region-selector.component.html',
    styleUrls: ['./signaller-modal-region-selector.component.scss'],
    standalone: false,
})
export class SignallerModalRegionSelectorComponent
    implements OnInit, OnDestroy
{
    private readonly store = inject<Store<AppState>>(Store);
    private readonly hotkeys = inject(HotkeysService);
    readonly selectRegionService = inject(SelectSignallerRegionService);

    public simulatedRegionNames$!: Observable<SearchableDropdownOption[]>;

    private hotkeyLayer!: HotkeyLayer;

    readonly popover = viewChild.required(NgbPopover);

    public readonly switchSimulatedRegionHotkey = new Hotkey(
        'F2',
        false,
        () => {
            this.popover().open();
        }
    );
    public readonly openOverviewHotkey = new Hotkey('⇧ + F2', false, () => {
        this.selectOverview();
    });

    private readonly destroy$ = new Subject<void>();

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

        this.hotkeyLayer = this.hotkeys.createLayer();
        this.hotkeyLayer.addHotkey(this.switchSimulatedRegionHotkey);
        this.hotkeyLayer.addHotkey(this.openOverviewHotkey);

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
        this.hotkeys.removeLayer(this.hotkeyLayer);
        this.destroy$.next();
    }

    public selectRegion(selectedRegion: SearchableDropdownOption) {
        this.selectRegionService.selectSimulatedRegion(selectedRegion.key);
    }

    public selectOverview() {
        this.selectRegionService.selectSimulatedRegion(overviewId);
    }
}

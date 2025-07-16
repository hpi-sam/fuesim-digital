import type { OnChanges, OnDestroy, OnInit } from '@angular/core';
import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    ExerciseRadiogram,
    ExerciseSimulationBehaviorType,
} from 'digital-fuesim-manv-shared';
import type { UUID } from 'digital-fuesim-manv-shared';
import {
    StrictObject,
    getInformationRequestKeyDetails,
    isAccepted,
    isInterfaceSignallerKeyForClient,
    isUnread,
} from 'digital-fuesim-manv-shared';
import { groupBy } from 'lodash-es';
import type { BehaviorSubject, Observable } from 'rxjs';
import { Subject, map, takeUntil } from 'rxjs';
import { ExerciseService } from 'src/app/core/exercise.service';
import type { SearchableDropdownOption } from 'src/app/shared/components/searchable-dropdown/searchable-dropdown.component';
import type { HotkeyLayer } from 'src/app/shared/services/hotkeys.service';
import {
    Hotkey,
    HotkeysService,
} from 'src/app/shared/services/hotkeys.service';
import type { AppState } from 'src/app/state/app.state';
import { selectOwnClientId } from 'src/app/state/application/selectors/application.selectors';
import {
    createSelectBehaviorStates,
    selectRadiograms,
} from 'src/app/state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from 'src/app/state/get-state-snapshot';

export type InterfaceSignallerInteraction = Omit<
    SearchableDropdownOption,
    'backgroundColor' | 'color'
> & {
    details?: string;
    keywords?: string[];
    hotkey: Hotkey;
    secondaryHotkey?: Hotkey;
    requiredBehaviors: ExerciseSimulationBehaviorType[];
    errorMessage?: string;
    loading$?: BehaviorSubject<boolean>;
};

export function setLoadingState(
    interactions: InterfaceSignallerInteraction[],
    key: string,
    loadingState: boolean
) {
    interactions
        .find((information) => information.key === key)
        ?.loading$?.next(loadingState);
}

@Component({
    selector: 'app-signaller-modal-interactions',
    templateUrl: './signaller-modal-interactions.component.html',
    styleUrls: ['./signaller-modal-interactions.component.scss'],
    standalone: false,
})
export class SignallerModalInteractionsComponent
    implements OnInit, OnChanges, OnDestroy
{
    @Input()
    simulatedRegionId?: UUID;
    @Input()
    interactions: InterfaceSignallerInteraction[] = [];
    @Input()
    primaryActionLabel = '';
    @Input()
    showSecondaryButton = true;
    @Input()
    filterHotkeyKeys!: string;

    @ViewChild('filterInput')
    filterInput!: ElementRef;

    private hotkeyLayer: HotkeyLayer | null = null;
    private filterLayer: HotkeyLayer | null = null;
    private clientId!: UUID;

    filter = '';
    filterActive = false;
    selectedIndex = -1;

    get filteredInteractions() {
        const lowerFilterPhrases = this.filter.toLowerCase().split(/\s+/u);

        return this.interactions.filter((interaction) =>
            lowerFilterPhrases.every(
                (phrase) =>
                    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                    interaction.name.toLowerCase().includes(phrase) ||
                    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                    interaction.details?.toLowerCase().includes(phrase) ||
                    interaction.keywords?.some((keyword) =>
                        keyword.toLowerCase().includes(phrase)
                    )
            )
        );
    }

    filterHotkey!: Hotkey;
    readonly exitFilterHotkey = new Hotkey('Esc', false, () => {
        this.filterInput.nativeElement.blur();
    });
    readonly upHotkey = new Hotkey('up', false, () =>
        this.decreaseSelectedIndex()
    );
    readonly downHotkey = new Hotkey('down', false, () =>
        this.increaseSelectedIndex()
    );
    readonly confirmHotkey = new Hotkey('Enter', false, () => {
        this.selectionPrimaryAction();
        this.filterInput.nativeElement.blur();
    });
    readonly confirmSecondaryHotkey = new Hotkey('⇧ + Enter', false, () => {
        this.selectionSecondaryAction();
        this.filterInput.nativeElement.blur();
    });

    requestable$!: Observable<{ [key: string]: boolean }>;
    requestedRadiograms$!: Observable<{ [key: string]: ExerciseRadiogram[] }>;
    private readonly destroy$ = new Subject<void>();

    constructor(
        private readonly exerciseService: ExerciseService,
        private readonly store: Store<AppState>,
        private readonly hotkeysService: HotkeysService
    ) {}

    ngOnInit() {
        this.clientId = selectStateSnapshot(selectOwnClientId, this.store)!;
    }

    ngOnChanges() {
        if (this.hotkeyLayer) {
            this.hotkeysService.removeLayer(this.hotkeyLayer);
        }
        this.hotkeyLayer = this.hotkeysService.createLayer();

        this.interactions.forEach((interaction) => {
            this.hotkeyLayer!.addHotkey(interaction.hotkey);

            if (interaction.secondaryHotkey) {
                this.hotkeyLayer!.addHotkey(interaction.secondaryHotkey);
            }
        });

        if (this.filterHotkeyKeys && this.filterHotkeyKeys !== '') {
            this.filterHotkey = new Hotkey(this.filterHotkeyKeys, false, () => {
                this.filterInput.nativeElement.focus();
            });
            this.hotkeyLayer.addHotkey(this.filterHotkey);
        }

        if (this.simulatedRegionId) {
            const behaviors$ = this.store.select(
                createSelectBehaviorStates(this.simulatedRegionId)
            );

            this.requestable$ = behaviors$.pipe(
                map((behaviors) =>
                    Object.fromEntries(
                        this.interactions.map((interaction) => [
                            interaction.key,
                            interaction.requiredBehaviors.every(
                                (requiredBehavior) =>
                                    behaviors.some(
                                        (behavior) =>
                                            behavior.type === requiredBehavior
                                    )
                            ),
                        ])
                    )
                )
            );
        }

        const radiograms$ = this.store
            .select(selectRadiograms)
            .pipe(map((radiograms) => StrictObject.values(radiograms)));

        // Automatically accept all radiograms that contain reports for requested information
        radiograms$
            .pipe(
                map((radiograms) =>
                    radiograms.filter((radiogram) => isUnread(radiogram))
                ),
                map((radiograms) =>
                    radiograms.filter((radiogram) =>
                        isInterfaceSignallerKeyForClient(
                            radiogram.informationRequestKey,
                            this.clientId
                        )
                    )
                ),
                takeUntil(this.destroy$)
            )
            .subscribe((radiograms) => {
                radiograms.forEach((radiogram) => {
                    this.exerciseService.proposeAction({
                        type: '[Radiogram] Accept radiogram',
                        clientId: this.clientId,
                        radiogramId: radiogram.id,
                    });

                    setLoadingState(
                        this.interactions,
                        getInformationRequestKeyDetails(
                            radiogram.informationRequestKey!
                        ),
                        false
                    );
                });
            });

        this.requestedRadiograms$ = radiograms$.pipe(
            map((radiograms) =>
                radiograms.filter((radiogram) => isAccepted(radiogram))
            ),
            map((radiograms) =>
                radiograms.filter(
                    (radiogram) =>
                        isInterfaceSignallerKeyForClient(
                            radiogram.informationRequestKey,
                            this.clientId
                        ) &&
                        radiogram.simulatedRegionId === this.simulatedRegionId
                )
            ),
            map((radiograms) =>
                groupBy(radiograms, (radiogram) =>
                    getInformationRequestKeyDetails(
                        radiogram.informationRequestKey!
                    )
                )
            )
        );
    }

    ngOnDestroy() {
        if (this.hotkeyLayer) {
            this.hotkeysService.removeLayer(this.hotkeyLayer);
        }
        if (this.filterLayer) {
            this.hotkeysService.removeLayer(this.filterLayer);
        }

        this.destroy$.next();
    }

    onFilterFocus() {
        this.filterActive = true;

        this.filterLayer = this.hotkeysService.createLayer(true);
        this.filterLayer.addHotkey(this.exitFilterHotkey);
        this.filterLayer.addHotkey(this.upHotkey);
        this.filterLayer.addHotkey(this.downHotkey);
        this.filterLayer.addHotkey(this.confirmHotkey);
        this.filterLayer.addHotkey(this.confirmSecondaryHotkey);
    }

    onFilterBlur() {
        this.filterActive = false;
        this.filter = '';
        this.selectedIndex = -1;

        if (this.filterLayer) {
            this.hotkeysService.removeLayer(this.filterLayer);
            this.filterLayer = null;
        }
    }

    increaseSelectedIndex() {
        if (this.selectedIndex + 1 < this.filteredInteractions.length)
            this.selectedIndex++;
    }

    decreaseSelectedIndex() {
        // This is a check for greater-*equal* on purpose. `selectedIndex == -1` is a valid option (no selection)
        if (this.selectedIndex >= 0) this.selectedIndex--;
    }

    resetSelectedIndex() {
        if (this.filteredInteractions.length === 1) {
            this.selectedIndex = 0;
        } else {
            this.selectedIndex = -1;
        }
    }

    selectionPrimaryAction() {
        if (
            this.selectedIndex > -1 &&
            this.selectedIndex < this.filteredInteractions.length
        ) {
            this.filteredInteractions[this.selectedIndex]?.hotkey.callback(
                undefined,
                undefined
            );
        }
    }

    selectionSecondaryAction() {
        if (
            this.selectedIndex > -1 &&
            this.selectedIndex < this.filteredInteractions.length
        ) {
            this.filteredInteractions[
                this.selectedIndex
            ]?.secondaryHotkey?.callback(undefined, undefined);
        }
    }
}

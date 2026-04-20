import type { OnChanges, OnDestroy, OnInit } from '@angular/core';
import { Component, ElementRef, inject, input, viewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    ExerciseRadiogram,
    ExerciseSimulationBehaviorType,
    UUID,
} from 'fuesim-digital-shared';
import {
    TypeAssertedObject,
    getInformationRequestKeyDetails,
    isAccepted,
    isInterfaceSignallerKeyForClient,
    isUnread,
} from 'fuesim-digital-shared';
import { groupBy } from 'lodash-es';
import {
    BehaviorSubject,
    combineLatest,
    Observable,
    of,
    Subject,
    map,
    takeUntil,
} from 'rxjs';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { ExerciseService } from '../../../../../../../core/exercise.service';
import { SearchableDropdownOption } from '../../../../../../../shared/components/searchable-dropdown/searchable-dropdown.component';
import type { HotkeyLayer } from '../../../../../../../shared/services/hotkeys.service';
import {
    Hotkey,
    HotkeysService,
} from '../../../../../../../shared/services/hotkeys.service';
import type { AppState } from '../../../../../../../state/app.state';
import { selectOwnClientId } from '../../../../../../../state/application/selectors/application.selectors';
import {
    createSelectBehaviorStates,
    selectRadiograms,
} from '../../../../../../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../../../../../../state/get-state-snapshot';
import { HotkeyIndicatorComponent } from '../../../../../../../shared/components/hotkey-indicator/hotkey-indicator.component';
import { RadiogramCardComponent } from '../../trainer-modal/radiogram-list/radiogram-card/radiogram-card.component';

export type InterfaceSignallerInteraction = Omit<
    SearchableDropdownOption,
    'backgroundColor' | 'color'
> &
    (
        | {
              details?: string;
              keywords?: string[];
              hotkeyKeys: string;
              callback: () => void;
              hasSecondaryAction: false;
              requiredBehaviors: ExerciseSimulationBehaviorType[];
              errorMessage?: string;
              loading$?: BehaviorSubject<boolean>;
          }
        | {
              details?: string;
              keywords?: string[];
              hotkeyKeys: string;
              callback: () => void;
              hasSecondaryAction: true;
              secondaryHotkeyKeys: string;
              secondaryCallback: () => void;
              requiredBehaviors: ExerciseSimulationBehaviorType[];
              errorMessage?: string;
              loading$?: BehaviorSubject<boolean>;
          }
    );

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
    imports: [
        HotkeyIndicatorComponent,
        FormsModule,
        RadiogramCardComponent,
        AsyncPipe,
    ],
})
export class SignallerModalInteractionsComponent
    implements OnInit, OnChanges, OnDestroy
{
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly hotkeysService = inject(HotkeysService);

    readonly simulatedRegionId = input<UUID>();
    readonly interactions = input<InterfaceSignallerInteraction[]>([]);
    readonly primaryActionLabel = input('');
    readonly showSecondaryButton = input(true);
    readonly filterHotkeyKeys = input.required<string>();

    readonly filterInput = viewChild.required<ElementRef>('filterInput');

    private interactionHotkeys: {
        [key: string]: { primary: Hotkey; secondary?: Hotkey };
    } = {};
    private interactionRequestable: {
        [key: string]: Observable<boolean>;
    } = {};

    private readonly hotkeyLayer!: HotkeyLayer;
    private filterLayer!: HotkeyLayer;

    private clientId!: UUID;

    filter = '';
    filterActive = false;
    selectedIndex = -1;

    get filteredInteractions() {
        const lowerFilterPhrases = this.filter.toLowerCase().split(/\s+/u);

        return this.interactions()
            .map((interaction) => ({
                ...interaction,
                hotkeys: this.interactionHotkeys[interaction.key]!,
                requestable$: this.interactionRequestable[interaction.key]!,
            }))
            .filter((interaction) =>
                lowerFilterPhrases.every(
                    (phrase) =>
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
        this.filterInput().nativeElement.blur();
    });
    readonly upHotkey = new Hotkey('up', false, () =>
        this.decreaseSelectedIndex()
    );
    readonly downHotkey = new Hotkey('down', false, () =>
        this.increaseSelectedIndex()
    );
    readonly confirmHotkey = new Hotkey('Enter', false, () => {
        this.selectionPrimaryAction();
        this.filterInput().nativeElement.blur();
    });
    readonly confirmSecondaryHotkey = new Hotkey('⇧ + Enter', false, () => {
        this.selectionSecondaryAction();
        this.filterInput().nativeElement.blur();
    });

    requestedRadiograms$!: Observable<{ [key: string]: ExerciseRadiogram[] }>;

    private readonly changeOrDestroy$ = new Subject<void>();
    private readonly destroy$ = new Subject<void>();

    constructor() {
        this.hotkeyLayer = this.hotkeysService.createLayer();
    }

    ngOnInit() {
        this.clientId = selectStateSnapshot(selectOwnClientId, this.store)!;

        this.filterLayer = this.hotkeysService.createLayer(true, false);
        this.filterLayer.addHotkey(this.exitFilterHotkey);
        this.filterLayer.addHotkey(this.upHotkey);
        this.filterLayer.addHotkey(this.downHotkey);
        this.filterLayer.addHotkey(this.confirmHotkey);
        this.filterLayer.addHotkey(this.confirmSecondaryHotkey);
    }

    ngOnChanges() {
        this.changeOrDestroy$.next();

        this.hotkeyLayer.removeAllHotkeys();

        this.interactionHotkeys = {};
        this.interactionRequestable = {};

        const simulatedRegionId = this.simulatedRegionId();
        if (simulatedRegionId) {
            const behaviors$ = this.store.select(
                createSelectBehaviorStates(simulatedRegionId)
            );

            this.interactions().forEach((interaction) => {
                this.interactionRequestable[interaction.key] = behaviors$.pipe(
                    map((behaviors) =>
                        interaction.requiredBehaviors.every(
                            (requiredBehavior) =>
                                behaviors.some(
                                    (behavior) =>
                                        behavior.type === requiredBehavior
                                )
                        )
                    )
                );
            });
        } else {
            this.interactions().forEach((interaction) => {
                this.interactionRequestable[interaction.key] = of(true);
            });
        }

        this.interactions().forEach((interaction) => {
            const enabled$ = combineLatest([
                interaction.loading$ ?? of(false),
                this.interactionRequestable[interaction.key]!,
            ]).pipe(map(([loading, requestable]) => !loading && requestable));

            const hotkeys = {
                primary: new Hotkey(
                    interaction.hotkeyKeys,
                    false,
                    () => {
                        interaction.callback();
                    },
                    enabled$
                ),
                secondary: undefined as Hotkey | undefined,
            };
            this.hotkeyLayer.addHotkey(hotkeys.primary);

            if (interaction.hasSecondaryAction) {
                hotkeys.secondary = new Hotkey(
                    interaction.secondaryHotkeyKeys,
                    false,
                    () => {
                        this.tryCallSecondaryAction(interaction);
                    },
                    enabled$
                );
                this.hotkeyLayer.addHotkey(hotkeys.secondary);
            }

            this.interactionHotkeys[interaction.key] = hotkeys;
        });

        const filterHotkeyKeys = this.filterHotkeyKeys();
        if (filterHotkeyKeys && filterHotkeyKeys !== '') {
            this.filterHotkey = new Hotkey(filterHotkeyKeys, false, () => {
                this.filterInput().nativeElement.focus();
            });
            this.hotkeyLayer.addHotkey(this.filterHotkey);
        }

        const radiograms$ = this.store
            .select(selectRadiograms)
            .pipe(map((radiograms) => TypeAssertedObject.values(radiograms)));

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
                        this.interactions(),
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
                        radiogram.simulatedRegionId === this.simulatedRegionId()
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
        this.hotkeysService.removeLayer(this.filterLayer);
        this.hotkeysService.removeLayer(this.hotkeyLayer);

        this.changeOrDestroy$.next();
        this.destroy$.next();
    }

    onFilterFocus() {
        this.filterActive = true;

        this.filterLayer.enabled = true;
        this.hotkeysService.elevateLayer(this.filterLayer);
    }

    onFilterBlur() {
        this.filterActive = false;
        this.filter = '';
        this.selectedIndex = -1;

        this.filterLayer.enabled = false;
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
        this.filteredInteractions[this.selectedIndex]?.callback();
    }

    selectionSecondaryAction() {
        const interaction = this.filteredInteractions[this.selectedIndex];
        if (interaction) this.tryCallSecondaryAction(interaction);
    }

    tryCallSecondaryAction(interaction: InterfaceSignallerInteraction) {
        if (interaction.hasSecondaryAction) interaction.secondaryCallback();
    }
}

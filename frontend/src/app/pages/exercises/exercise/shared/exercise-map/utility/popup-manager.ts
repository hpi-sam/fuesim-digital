import type { Type, ViewContainerRef } from '@angular/core';
import type { Feature } from 'ol';
import { Overlay } from 'ol';
import type VectorLayer from 'ol/layer/Vector';
import { pairwise, Subject, takeUntil } from 'rxjs';
import type OlMap from 'ol/Map';
import type { UUID } from 'fuesim-digital-shared';
import { isEqual } from 'lodash-es';
import type { Positioning } from '../../utils/types/positioning';
import type { FeatureManager } from './feature-manager';
import type { PopupService } from './popup.service';

/**
 * A class that manages the creation and destruction of a single popup with freely customizable content
 * that should appear on the {@link popupOverlay}.
 */
export class PopupManager {
    public readonly popupOverlay: Overlay;
    private readonly destroy$ = new Subject<void>();
    private popupsEnabled = true;
    public get currentClosingIds(): UUID[] {
        return this.popupService.currentPopupOptions?.closingUUIDs ?? [];
    }
    private featureNameFeatureManagerDictionary!: Map<
        string,
        FeatureManager<any>
    >;

    constructor(
        private readonly popoverContent: ViewContainerRef,
        private readonly popoverContainer: HTMLDivElement,
        private readonly popupService: PopupService
    ) {
        this.popupOverlay = new Overlay({
            element: this.popoverContainer,
        });
        this.popupService.nextProposal$
            .pipe(pairwise(), takeUntil(this.destroy$))
            .subscribe(([oldProposal, newProposal]) => {
                if (newProposal.action === 'dismiss') {
                    console.log('dismissing ');
                    oldProposal.options?.onDismissCallback?.call(undefined);
                }

                if (
                    newProposal.action === 'toggle' &&
                    this.isSamePopup(oldProposal.options, newProposal.options)
                ) {
                    this.popupService.dismissPopup();
                    return;
                }

                if (newProposal.action === 'toggle') {
                    // opening a new popup dismisses the previous one
                    oldProposal.options?.onDismissCallback?.call(undefined);

                    this.openPopup(newProposal.options);
                } else {
                    this.closePopup();
                }

                this.handleLayerChanges(oldProposal, newProposal);
            });
    }

    private handleLayerChanges(
        oldProposal?: { options?: { changedLayers?: string[] } },
        newProposal?: { options?: { changedLayers?: string[] } }
    ) {
        const changedLayers = new Set([
            ...(oldProposal?.options?.changedLayers ?? []),
            ...(newProposal?.options?.changedLayers ?? []),
        ]);
        changedLayers.forEach((featureName) => {
            this.featureNameFeatureManagerDictionary
                .get(featureName)
                ?.layer.changed();
        });
    }

    public setPopupsEnabled(enabled: boolean) {
        this.popupsEnabled = enabled;
        if (!enabled) {
            // Close all open popups
            this.popupService.dismissPopup();
        }
    }

    public registerPopupTriggers(
        olMap: OlMap,
        openLayersContainer: HTMLDivElement,
        layerFeatureManagerDictionary: Map<VectorLayer, FeatureManager<any>>,
        featureNameFeatureManagerDictionary: Map<string, FeatureManager<any>>
    ) {
        this.featureNameFeatureManagerDictionary =
            featureNameFeatureManagerDictionary;
        olMap.on('singleclick', (event) => {
            if (!this.popupsEnabled) {
                return;
            }

            const hasBeenHandled = olMap.forEachFeatureAtPixel(
                event.pixel,
                (feature, layer) => {
                    // Skip layer when unset
                    // OpenLayers type definitions are incorrect, layer may be `null`
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (layer === null) {
                        return false;
                    }
                    layerFeatureManagerDictionary
                        .get(layer as VectorLayer)!
                        .onFeatureClicked(event, feature as Feature);
                    // we only want the top one -> a truthy return breaks this loop
                    return true;
                },
                { hitTolerance: 10 }
            );
            if (!hasBeenHandled) {
                this.popupService.dismissPopup();
            }
        });

        openLayersContainer.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closePopup();
            }
        });
    }

    private isSamePopup(
        currentlyOpenPopupOptions: OpenPopupOptions | undefined,
        newOpenPopupOptions: OpenPopupOptions | undefined
    ): boolean {
        if (!currentlyOpenPopupOptions || !newOpenPopupOptions) return false;
        const {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            position: _,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            positioning: _1,
            ...oldOptionsWithoutPosition
        } = currentlyOpenPopupOptions;
        const {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            position: _2,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            positioning: _3,
            ...newOptionsWithoutPosition
        } = newOpenPopupOptions;

        return isEqual(oldOptionsWithoutPosition, newOptionsWithoutPosition);
    }

    private openPopup(options: OpenPopupOptions) {
        this.popoverContent.clear();
        const componentRef = this.popoverContent.createComponent(
            options.component
        );
        if (options.context) {
            for (const key of Object.keys(options.context)) {
                (componentRef.instance as any)[key] = (options.context as any)[
                    key
                ];
            }
        }
        componentRef.changeDetectorRef.detectChanges();
        this.popupOverlay.setPosition(options.position);
        this.popupOverlay.setPositioning(options.positioning);
    }

    private closePopup() {
        this.popoverContent.clear();
        this.popupOverlay.setPosition(undefined);
    }

    public destroy() {
        this.closePopup();
        this.destroy$.next();
    }
}

/**
 * {@link closingUUIDs} is an array containing the UUIDs of elements that when clicked shall close the pop-up
 * {@link markedForParticipantUUIDs} is an array containing the UUIDs of elements that are to be marked while the pop-up is open and in participant mode
 * {@link markedForTrainerUUIDs}  is an array containing the UUIDs of elements that are to be marked while the pop-up is open and in trainer mode
 * {@link changedLayers} is an array of feature types of which the corresponding layers are to be marked as changed upon pop-up opening and closing
 */
export interface OpenPopupOptions<Component = unknown> {
    elementUUID: UUID | undefined;
    position: number[];
    positioning: Positioning;
    component: Type<Component>;
    closingUUIDs: UUID[];
    markedForParticipantUUIDs: UUID[];
    markedForTrainerUUIDs: UUID[];
    changedLayers: string[];
    context?: Partial<Component>;

    /**
     * is called, if the popup is closed without {@link PopupService.submitPopup()}
     */
    onDismissCallback?: () => void;
}

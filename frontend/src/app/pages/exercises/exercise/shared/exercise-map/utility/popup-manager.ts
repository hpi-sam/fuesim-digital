import type { Type, ViewContainerRef } from '@angular/core';
import { Overlay } from 'ol';
import { pairwise, Subject, takeUntil } from 'rxjs';
import type { UUID } from 'fuesim-digital-shared';
import { isEqual } from 'lodash-es';
import type { Positioning } from '../../utils/types/positioning';
import type { FeatureManager } from './feature-manager';
import type { FeatureSelectionService } from './feature-selection.service';

/**
 * A class that manages the creation and destruction of a single popup with freely customizable content
 * that should appear on the {@link popupOverlay}.
 */
export class PopupManager {
    public readonly popupOverlay: Overlay;
    private readonly destroy$ = new Subject<void>();
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
        private readonly popupService: FeatureSelectionService
    ) {
        this.popupOverlay = new Overlay({
            element: this.popoverContainer,
        });
        this.popupService.nextProposal$
            .pipe(pairwise(), takeUntil(this.destroy$))
            .subscribe(([oldProposal, newProposal]) => {
                if (newProposal.action === 'dismiss') {
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

    public registerFeatureManagerDictionary(
        featureNameFeatureManagerDictionary: Map<string, FeatureManager<any>>
    ) {
        this.featureNameFeatureManagerDictionary =
            featureNameFeatureManagerDictionary;
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

export interface OpenPopupOptions<Component = unknown> {
    elementUUID: UUID | undefined;
    position: number[];
    positioning: Positioning;
    /**
     * the angular component to be instantiated
     */
    component: Type<Component>;
    /**
     * an array containing the UUIDs of elements that when clicked shall close the pop-up
     */
    closingUUIDs: UUID[];
    /**
     * an array containing the UUIDs of elements that are to be marked while the pop-up is open and in participant mode
     */
    markedForParticipantUUIDs: UUID[];
    /**
     *  an array containing the UUIDs of elements that are to be marked while the pop-up is open and in trainer mode
     */
    markedForTrainerUUIDs: UUID[];
    /**
     * an array of feature types of which the corresponding layers are to be marked as changed upon pop-up opening and closing
     */
    changedLayers: string[];
    /**
     * properties that are set on {@link component} at the time of creation
     */
    context?: Partial<Component>;

    /**
     * is called, if the popup is closed without {@link FeatureSelectionService.submitPopup()}
     */
    onDismissCallback?: () => void;
}

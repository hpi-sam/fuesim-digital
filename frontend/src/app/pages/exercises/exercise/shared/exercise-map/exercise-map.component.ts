import { type AfterViewInit, type OnDestroy } from '@angular/core';
import {
    Component,
    ElementRef,
    ViewContainerRef,
    inject,
    signal,
    viewChild,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DragElementService } from '../core/drag-element.service';
import { TransferLinesService } from '../core/transfer-lines.service';
import { openCoordinatePickerModal } from '../coordinate-picker/open-coordinate-picker-modal';
import { ExerciseService } from '../../../../../core/exercise.service';
import { DrawingInteractionService } from '../../../../../core/drawing-interaction.service';
import type { AppState } from '../../../../../state/app.state';
import {
    selectRestrictedViewport,
    selectCurrentMainRole,
} from '../../../../../state/application/selectors/shared.selectors';
import { DisplayMessagesComponent } from '../../../../../feature/messages/display-messages/display-messages.component';
import { OlMapManager, olMapCoordinatesSchema } from './utility/ol-map-manager';
import { PopupManager } from './utility/popup-manager';
import { PopupService } from './utility/popup.service';
import { OlMapManagerService } from './utility/ol-map-manager.service';

@Component({
    selector: 'app-exercise-map',
    templateUrl: './exercise-map.component.html',
    styleUrls: ['./exercise-map.component.scss'],
    imports: [DisplayMessagesComponent, AsyncPipe],
})
export class ExerciseMapComponent implements AfterViewInit, OnDestroy {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);
    readonly dragElementService = inject(DragElementService);
    readonly transferLinesService = inject(TransferLinesService);
    private readonly popupService = inject(PopupService);
    private readonly modalService = inject(NgbModal);
    private readonly route = inject(ActivatedRoute);
    readonly olMapManagerService = inject(OlMapManagerService);
    private readonly drawingInteractionService = inject(
        DrawingInteractionService
    );

    readonly openLayersContainer = viewChild.required<
        ElementRef<HTMLDivElement>
    >('openLayersContainer');
    readonly popoverContainer =
        viewChild.required<ElementRef<HTMLDivElement>>('popoverContainer');
    readonly popoverContent = viewChild.required('popoverContent', {
        read: ViewContainerRef,
    });

    private readonly destroy$ = new Subject<void>();
    private popupManager?: PopupManager;
    public readonly restrictedToViewport$ = this.store.select(
        selectRestrictedViewport
    );
    public readonly currentRole$ = this.store.select(selectCurrentMainRole);

    ngAfterViewInit(): void {
        this.popupManager = new PopupManager(
            this.popoverContent(),
            this.popoverContainer().nativeElement,
            this.popupService
        );
        this.olMapManagerService.olMapManager = new OlMapManager(
            this.store,
            this.exerciseService,
            this.openLayersContainer().nativeElement,
            this.transferLinesService,
            this.popupManager,
            this.popupService,
            this.drawingInteractionService
        );
        this.dragElementService.registerMap(
            this.olMapManagerService.olMapManager.olMap
        );
        this.dragElementService.registerLayerFeatureManagerDictionary(
            this.olMapManagerService.olMapManager.layerFeatureManagerDictionary
        );

        // Check whether the map is fullscreen
        this.openLayersContainer().nativeElement.addEventListener(
            'fullscreenchange',
            (event) => {
                this.fullscreenEnabled.set(document.fullscreenElement !== null);
            }
        );

        const queryParams = this.route.snapshot.queryParams;
        const result = olMapCoordinatesSchema.safeParse(queryParams);
        if (result.success) {
            this.olMapManagerService.olMapManager.tryGoToCoordinates(
                result.data
            );
        }
    }

    public readonly fullscreenEnabled = signal(false);
    public toggleFullscreen() {
        if (!this.fullscreenEnabled()) {
            this.openLayersContainer().nativeElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    public goToCoordinates() {
        if (!this.olMapManagerService.olMapManager) return;

        openCoordinatePickerModal(this.modalService);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.dragElementService.unregisterMap();
        this.dragElementService.unregisterLayerFeatureManagerDictionary();
    }
}

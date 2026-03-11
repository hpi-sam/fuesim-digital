import type { AfterViewInit, OnDestroy } from '@angular/core';
import {
    Component,
    ElementRef,
    ViewContainerRef,
    inject,
    viewChild,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DragElementService } from '../core/drag-element.service';
import { TransferLinesService } from '../core/transfer-lines.service';
import { openCoordinatePickerModal } from '../coordinate-picker/open-coordinate-picker-modal';
import { ExerciseService } from '../../../../../core/exercise.service';
import type { AppState } from '../../../../../state/app.state';
import {
    selectRestrictedViewport,
    selectCurrentMainRole,
} from '../../../../../state/application/selectors/shared.selectors';
import { OlMapManager } from './utility/ol-map-manager';
import { PopupManager } from './utility/popup-manager';
import { PopupService } from './utility/popup.service';

@Component({
    selector: 'app-exercise-map',
    templateUrl: './exercise-map.component.html',
    styleUrls: ['./exercise-map.component.scss'],
    standalone: false,
})
export class ExerciseMapComponent implements AfterViewInit, OnDestroy {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);
    readonly dragElementService = inject(DragElementService);
    readonly transferLinesService = inject(TransferLinesService);
    private readonly popupService = inject(PopupService);
    private readonly modalService = inject(NgbModal);

    readonly openLayersContainer = viewChild.required<
        ElementRef<HTMLDivElement>
    >('openLayersContainer');
    readonly popoverContainer =
        viewChild.required<ElementRef<HTMLDivElement>>('popoverContainer');
    readonly popoverContent = viewChild.required('popoverContent', {
        read: ViewContainerRef,
    });

    private readonly destroy$ = new Subject<void>();
    public olMapManager?: OlMapManager;
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
        this.olMapManager = new OlMapManager(
            this.store,
            this.exerciseService,
            this.openLayersContainer().nativeElement,
            this.transferLinesService,
            this.popupManager,
            this.popupService
        );
        this.dragElementService.registerMap(this.olMapManager.olMap);
        this.dragElementService.registerLayerFeatureManagerDictionary(
            this.olMapManager.layerFeatureManagerDictionary
        );

        // Check whether the map is fullscreen
        this.openLayersContainer().nativeElement.addEventListener(
            'fullscreenchange',
            (event) => {
                this.fullscreenEnabled = document.fullscreenElement !== null;
            }
        );
    }

    public fullscreenEnabled = false;
    public toggleFullscreen() {
        if (!this.fullscreenEnabled) {
            this.openLayersContainer().nativeElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    public goToCoordinates() {
        if (!this.olMapManager) return;

        openCoordinatePickerModal(this.modalService, this.olMapManager);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.dragElementService.unregisterMap();
        this.dragElementService.unregisterLayerFeatureManagerDictionary();
    }
}

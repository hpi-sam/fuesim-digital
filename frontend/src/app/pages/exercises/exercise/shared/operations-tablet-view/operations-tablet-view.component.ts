import {
    AfterViewInit,
    Component,
    ElementRef,
    OnDestroy,
    viewChild,
} from '@angular/core';
import { NgbNav, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { OperationalSectionsTabComponent } from './operational-sections/operational-sections.component';
import { OperationDetailsTabComponent } from './operation-details/operation-details.component';

@Component({
    selector: 'app-operations-tablet-view',
    templateUrl: './operations-tablet-view.component.html',
    styleUrl: './operations-tablet-view.component.scss',
    imports: [
        NgbNav,
        NgbNavModule,
        OperationalSectionsTabComponent,
        OperationDetailsTabComponent,
    ],
})
export class OperationsTabletViewComponent implements AfterViewInit, OnDestroy {
    public readonly operationsTabletViewRoot =
        viewChild<ElementRef<HTMLDivElement>>('otvRoot');

    public fullscreenEnabled = false;

    public fullscreenEventListener() {
        this.fullscreenEnabled = document.fullscreenElement !== null;
    }

    public toggleFullscreen(): void {
        if (!this.fullscreenEnabled) {
            this.operationsTabletViewRoot()?.nativeElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    ngAfterViewInit(): void {
        this.operationsTabletViewRoot()?.nativeElement.addEventListener(
            'fullscreenchange',
            this.fullscreenEventListener.bind(this)
        );
    }

    ngOnDestroy(): void {
        this.operationsTabletViewRoot()?.nativeElement.removeEventListener(
            'fullscreenchange',
            this.fullscreenEventListener.bind(this)
        );
    }
}

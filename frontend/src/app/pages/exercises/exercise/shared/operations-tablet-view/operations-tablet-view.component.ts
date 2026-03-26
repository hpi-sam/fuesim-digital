import {
    AfterViewInit,
    Component,
    ElementRef,
    OnDestroy,
    signal,
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

    public readonly fullscreenEnabled = signal<boolean>(false);

    public readonly activeTab = signal<string>('operational-sections');

    public fullscreenEventListener() {
        this.fullscreenEnabled.set(document.fullscreenElement !== null);
    }

    public toggleFullscreen() {
        if (!this.fullscreenEnabled()) {
            this.operationsTabletViewRoot()?.nativeElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    ngAfterViewInit() {
        this.operationsTabletViewRoot()?.nativeElement.addEventListener(
            'fullscreenchange',
            this.fullscreenEventListener.bind(this)
        );
    }

    ngOnDestroy() {
        this.operationsTabletViewRoot()?.nativeElement.removeEventListener(
            'fullscreenchange',
            this.fullscreenEventListener.bind(this)
        );
    }
}

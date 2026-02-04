import {
    AfterViewInit,
    Component,
    ElementRef,
    OnDestroy,
    ViewChild,
} from '@angular/core';

@Component({
    selector: 'app-operations-tablet-view',
    standalone: false,
    templateUrl: './operations-tablet-view.component.html',
    styleUrl: './operations-tablet-view.component.scss',
})
export class OperationsTabletViewComponent implements AfterViewInit, OnDestroy {
    @ViewChild('otvRoot')
    public operationsTabletViewRoot!: ElementRef<HTMLDivElement>;

    public fullscreenEnabled = false;

    public fullscreenEventListener() {
        this.fullscreenEnabled = document.fullscreenElement !== null;
    }

    public toggleFullscreen(): void {
        if (!this.fullscreenEnabled) {
            this.operationsTabletViewRoot.nativeElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    ngAfterViewInit(): void {
        this.operationsTabletViewRoot.nativeElement.addEventListener(
            'fullscreenchange',
            this.fullscreenEventListener.bind(this)
        );
    }

    ngOnDestroy(): void {
        this.operationsTabletViewRoot.nativeElement.removeEventListener(
            'fullscreenchange',
            this.fullscreenEventListener.bind(this)
        );
    }
}

import {
    OnDestroy,
    signal,
    Component,
    TemplateRef,
    inject,
    effect,
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgTemplateOutlet } from '@angular/common';
import type { HotkeyLayer } from '../../../../../../../../shared/services/hotkeys.service';
import {
    Hotkey,
    HotkeysService,
} from '../../../../../../../../shared/services/hotkeys.service';
import { AutofocusDirective } from '../../../../../../../../shared/directives/autofocus.directive';
import { HotkeyIndicatorComponent } from '../../../../../../../../shared/components/hotkey-indicator/hotkey-indicator.component';

@Component({
    selector: 'app-signaller-modal-details-modal',
    templateUrl: './signaller-modal-details-modal.component.html',
    styleUrls: ['./signaller-modal-details-modal.component.scss'],
    imports: [AutofocusDirective, NgTemplateOutlet, HotkeyIndicatorComponent],
})
export class SignallerModalDetailsModalComponent implements OnDestroy {
    private readonly activeModal = inject(NgbActiveModal);
    private readonly hotkeysService = inject(HotkeysService);

    readonly title = signal('');
    readonly body = signal<TemplateRef<any> | null>(null);
    readonly hotkeysEnabled = signal(true);

    private hotkeyLayer?: HotkeyLayer;
    private readonly closeHotkey = new Hotkey('Esc', false, () => this.close());

    constructor() {
        effect(() => {
            if (this.hotkeysEnabled() && !this.hotkeyLayer) {
                this.hotkeyLayer = this.hotkeysService.createLayer(true);
                this.hotkeyLayer.addHotkey(this.closeHotkey);
            }
        });
    }

    ngOnDestroy() {
        if (this.hotkeyLayer) this.hotkeysService.removeLayer(this.hotkeyLayer);
    }

    public close() {
        this.activeModal.close();
    }
}

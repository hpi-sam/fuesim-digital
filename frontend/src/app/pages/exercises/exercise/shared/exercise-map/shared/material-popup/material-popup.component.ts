import type { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import type { UUID, Material } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import type { AppState } from 'src/app/state/app.state';
import { createSelectMaterial } from 'src/app/state/application/selectors/exercise.selectors';
import { PopupService } from '../../utility/popup.service';

@Component({
    selector: 'app-material-popup',
    templateUrl: './material-popup.component.html',
    styleUrls: ['./material-popup.component.scss'],
    standalone: false,
})
export class MaterialPopupComponent implements OnInit {
    public materialId!: UUID;

    public material$?: Observable<Material>;

    constructor(
        private readonly store: Store<AppState>,
        private readonly popupService: PopupService
    ) {}

    ngOnInit(): void {
        this.material$ = this.store.select(
            createSelectMaterial(this.materialId)
        );
    }

    public closePopup() {
        this.popupService.closePopup();
    }
}

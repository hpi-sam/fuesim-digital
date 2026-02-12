import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { UUID, Material } from 'fuesim-digital-shared';
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
    private readonly store = inject<Store<AppState>>(Store);
    private readonly popupService = inject(PopupService);

    public materialId!: UUID;

    public material$?: Observable<Material>;

    ngOnInit(): void {
        this.material$ = this.store.select(
            createSelectMaterial(this.materialId)
        );
    }

    public closePopup() {
        this.popupService.closePopup();
    }
}

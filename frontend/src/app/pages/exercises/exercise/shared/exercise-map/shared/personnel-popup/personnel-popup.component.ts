import type { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import type { UUID, Personnel } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import type { AppState } from 'src/app/state/app.state.js';
import { createSelectPersonnel } from 'src/app/state/application/selectors/exercise.selectors.js';
import { PopupService } from '../../utility/popup.service.js';

@Component({
    selector: 'app-personnel-popup',
    templateUrl: './personnel-popup.component.html',
    styleUrls: ['./personnel-popup.component.scss'],
    standalone: false,
})
export class PersonnelPopupComponent implements OnInit {
    public personnelId!: UUID;

    public personnel$?: Observable<Personnel>;

    constructor(
        private readonly store: Store<AppState>,
        private readonly popupService: PopupService
    ) {}

    ngOnInit(): void {
        this.personnel$ = this.store.select(
            createSelectPersonnel(this.personnelId)
        );
    }

    public closePopup() {
        this.popupService.closePopup();
    }
}

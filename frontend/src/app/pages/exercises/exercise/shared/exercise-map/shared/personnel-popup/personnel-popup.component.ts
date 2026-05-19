import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { UUID, Personnel } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { PopupService } from '../../utility/popup.service';
import type { AppState } from '../../../../../../../state/app.state';
import { createSelectPersonnel } from '../../../../../../../state/application/selectors/exercise.selectors';
import { PersonnelDetailsComponent } from '../../../../../../../shared/components/personnel-details/personnel-details.component';

@Component({
    selector: 'app-personnel-popup',
    templateUrl: './personnel-popup.component.html',
    styleUrls: ['./personnel-popup.component.scss'],
    imports: [PersonnelDetailsComponent, AsyncPipe],
})
export class PersonnelPopupComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly popupService = inject(PopupService);

    public personnelId!: UUID;

    public personnel$?: Observable<Personnel>;

    ngOnInit(): void {
        this.personnel$ = this.store.select(
            createSelectPersonnel(this.personnelId)
        );
    }

    public closePopup() {
        this.popupService.dismissPopup();
    }
}

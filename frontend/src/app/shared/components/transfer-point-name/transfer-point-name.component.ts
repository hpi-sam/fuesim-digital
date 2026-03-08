import type { OnChanges } from '@angular/core';
import { Component, Input, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { TransferPoint, UUID } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import type { AppState } from '../../../state/app.state';
import { createSelectTransferPoint } from '../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-transfer-point-name',
    templateUrl: './transfer-point-name.component.html',
    styleUrls: ['./transfer-point-name.component.scss'],
    standalone: false,
})
export class TransferPointNameComponent implements OnChanges {
    private readonly store = inject<Store<AppState>>(Store);

    @Input() transferPointId!: UUID;

    public transferPoint$?: Observable<TransferPoint>;

    ngOnChanges() {
        this.transferPoint$ = this.store.select(
            createSelectTransferPoint(this.transferPointId)
        );
    }
}

import type { OnChanges } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { TransferPoint, UUID } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import type { AppState } from '../../../state/app.state';
import { createSelectTransferPoint } from '../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-transfer-point-name',
    templateUrl: './transfer-point-name.component.html',
    styleUrls: ['./transfer-point-name.component.scss'],
    imports: [AsyncPipe],
})
export class TransferPointNameComponent implements OnChanges {
    private readonly store = inject<Store<AppState>>(Store);

    readonly transferPointId = input.required<UUID>();

    public transferPoint$?: Observable<TransferPoint>;

    ngOnChanges() {
        this.transferPoint$ = this.store.select(
            createSelectTransferPoint(this.transferPointId())
        );
    }
}

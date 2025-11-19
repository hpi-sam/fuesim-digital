import type { OnInit } from '@angular/core';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import type { TransferPoint, UUID } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import type { AppState } from 'src/app/state/app.state';
import { selectTransferPoints } from 'src/app/state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-transfer-target-dropdown',
    templateUrl: './transfer-target-dropdown.component.html',
    styleUrls: ['./transfer-target-dropdown.component.scss'],
    standalone: false,
})
export class TransferTargetDropdownComponent implements OnInit {
    private _selectedTransferPointId: UUID | undefined;
    @Input()
    get selectedTransferPointId() {
        return this._selectedTransferPointId;
    }
    set selectedTransferPointId(targetTransferPointId: UUID | undefined) {
        this._selectedTransferPointId = targetTransferPointId;
        this.selectedTransferPointIdChange.emit(this._selectedTransferPointId);
    }
    @Output() readonly selectedTransferPointIdChange = new EventEmitter<
        UUID | undefined
    >();

    public transferPoints$!: Observable<{ [key in UUID]: TransferPoint }>;

    constructor(private readonly store: Store<AppState>) {}

    ngOnInit(): void {
        this.transferPoints$ = this.store.select(selectTransferPoints);
    }
}

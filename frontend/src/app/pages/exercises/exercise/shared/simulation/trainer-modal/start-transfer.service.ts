import { Injectable } from '@angular/core';
import type {
    Hospital,
    TransferPoint,
    UUIDSet,
    Vehicle,
} from 'digital-fuesim-manv-shared';
import { Subject } from 'rxjs';

export interface TransferOptions {
    vehicleToTransfer?: Vehicle;
    patientsToTransfer?: UUIDSet;
    transferDestination?: Hospital | TransferPoint;
}

@Injectable()
export class StartTransferService {
    public readonly transferOptions = new Subject<TransferOptions>();

    public initiateNewTransferFor(transferOptions: TransferOptions) {
        this.transferOptions.next(transferOptions);
    }
}

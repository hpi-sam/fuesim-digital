import { Component, inject, OnDestroy } from '@angular/core';
import { CollectionDto } from 'fuesim-digital-shared';
import { first, Subject, takeUntil } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-marketplace-join-collection-modal',
    templateUrl: './join-collection-modal.component.html',
    styleUrl: './join-collection-modal.component.scss',
    imports: [],
})
export class JoinCollectionModalComponent implements OnDestroy {
    private readonly activeModal = inject(NgbActiveModal);

    public collection!: CollectionDto;
    public onJoin = new Subject<boolean>();

    private readonly destroy$ = new Subject<void>();

    constructor() {
        this.onJoin.pipe(first(), takeUntil(this.destroy$)).subscribe((_) => {
            this.activeModal.close();
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}

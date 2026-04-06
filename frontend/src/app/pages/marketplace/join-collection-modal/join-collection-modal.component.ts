import { Component, inject, resource } from '@angular/core';
import { DatePipe, JsonPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CollectionService } from '../../../core/exercise-element.service';
import { CollectionDto } from 'fuesim-digital-shared';
import { first, Subject } from 'rxjs';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    templateUrl: './join-collection-modal.component.html',
    styleUrl: './join-collection-modal.component.scss',
    imports: [JsonPipe, DatePipe, RouterLink],
})
export class JoinCollectionModalComponent {
    private readonly activeModal = inject(NgbActiveModal);

    public collection!: CollectionDto;
    public onJoin = new Subject<boolean>();

    constructor() {
        this.onJoin.pipe(first()).subscribe((_) => {
            this.activeModal.close();
        });
    }
}

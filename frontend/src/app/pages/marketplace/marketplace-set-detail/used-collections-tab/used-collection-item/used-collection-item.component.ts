import { AsyncPipe, JsonPipe } from '@angular/common';
import { Component, inject, input, resource } from '@angular/core';
import {
    NgbDropdownModule,
    NgbModal,
    NgbNavModule,
} from '@ng-bootstrap/ng-bootstrap';
import {
    CollectionEntityId,
    Marketplace,
    CollectionVersionId,
    getCollectionElementDiff,
    findElementVersionsInContent,
    ElementVersionId,
    ElementDto,
    ChangeDependencies,
    CollectionElementsSingle,
    gatherCollectionElements,
} from 'fuesim-digital-shared';
import * as z from 'zod';
import { CollectionService } from '../../../../../core/exercise-element.service';
import { ElementCardComponent } from '../../../element-card/element-card.component';
import { CollectionUpgradeImpactModalComponent } from '../../../marketplace-collection-update-impact-modal/marketplace-collection-update-impact-modal.component';
import { LoadingModalService } from '../../../../../core/loading-modal/loading-modal.service';
import { CollectionElementsListComponent } from '../../collection-elements-list/collection-elements-list.component';
import { RouterLink } from '@angular/router';
import { ConfirmationModalService } from '../../../../../core/confirmation-modal/confirmation-modal.service';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-used-collection-item',
    imports: [
        ElementCardComponent,
        NgbDropdownModule,
        NgbNavModule,
        AsyncPipe,
        JsonPipe,
        CollectionElementsListComponent,
        RouterLink,
    ],
    templateUrl: './used-collection-item.component.html',
    styleUrl: './used-collection-item.component.scss',
})
export class UsedCollectionItemComponent {
    private readonly collectionService = inject(CollectionService);
    private readonly ngbModalService = inject(NgbModal);
    private readonly loadingModalService = inject(LoadingModalService);
    private readonly confirmationService = inject(ConfirmationModalService);

    public readonly currentCollectionEntityId =
        input.required<CollectionEntityId>();
    public readonly dependency = input.required<CollectionElementsSingle>();

    public readonly newerVersionAvailable = resource({
        params: () => ({ collection: this.dependency().collection }),
        loader: async ({ params: { collection } }) =>
            this.collectionService.checkNewerVersionAvailable(collection),
    });

    public async openUpgradeVersionModal() {
        this.loadingModalService.showLoading({
            title: 'Daten werden geladen...',
            description:
                'Es werden die Elemente der alten und neuen Version geladen, um die Auswirkungen des Updates anzuzeigen.',
        });
        const value = this.newerVersionAvailable.value();
        if (!value) return;
        if (!value.newerVersionAvailable) {
            return;
        }

        // we fetch the current elements again to handle the case where we have gotten out of sync
        const currentCollectionElement =
            await this.collectionService.getLatestElementsByCollectionId(
                this.currentCollectionEntityId()
            );
        const newVersionElements =
            await this.collectionService.getElementsOfCollectionVersion(
                value.latestVersion
            );
        const oldVersionElements =
            await this.collectionService.getElementsOfCollectionVersion(
                this.dependency().collection
            );
        const changes = getCollectionElementDiff(
            oldVersionElements.direct,
            newVersionElements.direct
        );

        const currentCollectionDependencies: {
            element: ElementDto;
            dependsOn: ElementVersionId[];
        }[] = [];
        for (const currentElement of currentCollectionElement.direct) {
            currentCollectionDependencies.push({
                element: currentElement,
                dependsOn: findElementVersionsInContent(currentElement.content)
                    .ids,
            });
        }
        console.log({ currentCollectionDependencies });

        const changeDependencies: ChangeDependencies = {};
        for (const change of changes) {
            if (change.type === 'create') continue;
            const elementId = change.old?.versionId || change.new?.versionId;
            if (!elementId) continue;

            const dependingElements = currentCollectionDependencies
                .filter((dep) => dep.dependsOn.includes(elementId))
                .map((dep) => dep.element);
            changeDependencies[elementId] = dependingElements;
        }

        console.log({ changeDependencies });

        console.log({ newVersionElements, oldVersionElements });

        this.loadingModalService.closeLoading();
        const modal = this.ngbModalService.open(
            CollectionUpgradeImpactModalComponent,
            {
                size: 'xl',
            }
        );

        const modalInstance =
            modal.componentInstance as CollectionUpgradeImpactModalComponent;
        modalInstance.changes = changes;
        modalInstance.collectionElements = gatherCollectionElements(newVersionElements).allVisibleElements()
        modalInstance.changeDependencies = changeDependencies;

        const result = await firstValueFrom(modalInstance.confirmationResult$);
        if (!result) return;

        const newVersion = value.latestVersion;
        await this.collectionService.addCollectionDependency({
            importTo: this.currentCollectionEntityId(),
            importFrom: newVersion.versionId,
        });
    }

    public async removeCollectionDependency(
        collectionVersionId: CollectionVersionId
    ) {
        const confirmation = await this.confirmationService.confirm({
            title: 'Sammlung als Abhängigkeit entfernen',
            description: `Möchten Sie die Sammlung "${this.dependency().collection.title}" wirklich als Abhängigkeit entfernen? Sie verlieren dadurch innerhalb der aktuellen Sammlung, Zugriff auf diese Inhalte.`,
            confirmationButtonText: 'Abhängigkeit entfernen',
        });

        if (!confirmation) return;

        await this.collectionService.removeCollectionDependency({
            removeFrom: this.currentCollectionEntityId(),
            removeVersionId: collectionVersionId,
        });
    }
}

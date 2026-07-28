import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import type {
    ChangeDependencies,
    ElementVersionId,
    TemplateVersion,
} from 'fuesim-digital-shared';
import {
    getCollectionElementDiff,
    getElementDependencies,
} from 'fuesim-digital-shared';
import { firstValueFrom } from 'rxjs';
import { CollectionUpgradeImpactModalComponent } from './marketplace-collection-update-impact-modal.component';

export async function openMarketplaceCollectionUpdateImpactModal(
    ngbModalService: NgbModal,
    opts: {
        oldCollectionElements: TemplateVersion[];
        newCollectionElements: TemplateVersion[];
    }
): Promise<boolean | null> {
    const currentCollectionDependencies: {
        element: TemplateVersion;
        dependsOn: ElementVersionId[];
    }[] = [];
    for (const currentElement of opts.oldCollectionElements) {
        currentCollectionDependencies.push({
            element: currentElement,
            dependsOn: getElementDependencies(currentElement.content),
        });
    }

    const changes = getCollectionElementDiff(
        opts.oldCollectionElements,
        opts.newCollectionElements
    );

    // Calculate which elements of the current collection depend
    // on changed elements of the dependency, to be able to
    // show the impact of the update
    const changeDependencies: ChangeDependencies = {};
    for (const change of changes) {
        if (change.type === 'create') continue;
        const elementId = change.old.versionId;
        if (!elementId) continue;

        const dependingElements = currentCollectionDependencies
            .filter((dep) => dep.dependsOn.includes(elementId))
            .map((dep) => dep.element);
        changeDependencies[elementId] = dependingElements;
    }

    const modal = ngbModalService.open(CollectionUpgradeImpactModalComponent, {
        size: 'xl',
    });
    const modalInstance =
        modal.componentInstance as CollectionUpgradeImpactModalComponent;
    modalInstance.changes = changes;
    modalInstance.collectionElements = opts.newCollectionElements;
    modalInstance.changeDependencies = changeDependencies;
    modalInstance.confirmationButtonText =
        'Änderungen annehmen und Sammlung aktualisieren';

    return firstValueFrom(modalInstance.confirmationResult$);
}

import type { CollectionEntityId } from 'fuesim-digital-shared';
import { lastValueFrom } from 'rxjs';
import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MarketplaceSelectCollectionModalComponent } from './marketplace-select-collection-modal.component';

export async function openSelectCollectionModal(
    ngbModalService: NgbModal,
    opts?: {
        showDependencyElements?: boolean;
        disallowedCollections?: CollectionEntityId[];
        allowLeave?: boolean;
        allowCreate?: boolean;
        showInfoBanner?: boolean;
    }
) {
    const modal = ngbModalService.open(
        MarketplaceSelectCollectionModalComponent,
        {
            size: 'xl',
            backdrop: opts?.allowLeave === false ? 'static' : true,
        }
    );
    const component =
        modal.componentInstance as MarketplaceSelectCollectionModalComponent;

    component.showDependencyElements = opts?.showDependencyElements ?? false;
    component.disallowedCollections = opts?.disallowedCollections ?? [];
    component.allowLeave = opts?.allowLeave ?? true;
    component.allowCreate = opts?.allowCreate ?? false;
    component.showInfoBanner = opts?.showInfoBanner ?? false;

    const result = await lastValueFrom(component.collectionSelectionResult$);
    return result;
}

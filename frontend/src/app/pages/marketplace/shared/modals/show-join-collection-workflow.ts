import type { OrganisationId } from 'fuesim-digital-shared';
import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import type { PromptModalService } from '../../../../core/prompt-modal/prompt-modal.service';
import type { CollectionService } from '../../../../core/exercise-element.service';
import { openSelectOrganisationModal } from './select-organisation-modal/open-select-organisation-modal';

export async function showJoinCollectionWorkflow(
    promptService: PromptModalService,
    collectionService: CollectionService,
    ngbModalService: NgbModal,
    preSelectedOrganisationId?: OrganisationId
) {
    const promptResult = await promptService.prompt({
        title: 'Sammlung beitreten',
        description:
            'Bitte geben Sie den Einladungscode ein, um der Sammlung beizutreten.',
        placeholder: 'Einladungscode',
        confirmationButtonText: 'Beitreten',
    });

    if (promptResult.result !== true) return;

    const collectionPreview = await collectionService.getJoinCodePreview(
        promptResult.value
    );

    console.log(collectionPreview);

    const organisationId =
        preSelectedOrganisationId ??
        (await openSelectOrganisationModal(ngbModalService, {
            descriptionText: `Bitte wählen Sie die Organisation aus, mit der Sie der Sammlung "${collectionPreview.title}" beitreten möchten. Die Sammlung wird dann in dieser Organisation verfügbar sein.`,
        }));

    console.log(organisationId);

    await collectionService.joinCollectionByJoinCode(
        promptResult.value,
        organisationId
    );
}

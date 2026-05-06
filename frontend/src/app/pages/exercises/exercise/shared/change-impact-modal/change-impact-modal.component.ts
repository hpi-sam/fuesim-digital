import { Component, inject, OnInit, signal } from '@angular/core';
import { JsonPipe, NgTemplateOutlet } from '@angular/common';
import { Tree, TreeItem, TreeItemGroup } from '@angular/aria/tree';
import { ChangeApply, ChangeImpact, ElementDto } from 'fuesim-digital-shared';
import { NgbActiveModal, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { CdkTreeModule } from '@angular/cdk/tree';
import { Immutable } from 'immer';
import { CollectionService } from '../../../../../core/exercise-element.service';
import { VersionedElementDisplayNamePipe } from '../../../../../shared/pipes/versioned-element-type-display-name.pipe';
import { DeletedElementChangeApplyItemComponent } from './deleted-element-item/deleted-element-item.component';
import { EditedElementChangeApplyItemComponent } from './edited-element-item/edited-element-item.component';
import {
    buildChangeImpactTree,
    ChangeImpactTreeNode,
} from './change-impact-tree-builder';

@Component({
    selector: 'app-change-impact-modal',
    templateUrl: './change-impact-modal.component.html',
    styleUrl: './change-impact-modal.component.scss',
    imports: [
        VersionedElementDisplayNamePipe,
        EditedElementChangeApplyItemComponent,
        DeletedElementChangeApplyItemComponent,
        NgbTooltip,
        CdkTreeModule,
        Tree,
        TreeItem,
        TreeItemGroup,
        NgTemplateOutlet,
        JsonPipe,
    ],
})
export class ChangeImpactModalComponent implements OnInit {
    readonly changeImpactTreeNodes = signal<ChangeImpactTreeNode[] | null>(
        null
    );

    readonly selected = signal([]);

    private readonly collectionService = inject(CollectionService);
    private readonly activeModal = inject(NgbActiveModal);

    // This data must be provided when opening the modal via NgbModal.
    public changes: ChangeImpact[] = [];
    public collectionElements!: Immutable<ElementDto[]>;

    public readonly submitChanges = new Subject<{
        /*
         * Returns whether the user accepted to apply the changes or not.
         */
        apply: boolean;
        /**
         * Whether the consumer of this data should ask the user for confirmation before applying the changes.
         */
        confirmationSuggested: boolean;
        changes: ChangeApply[];
    }>();

    public readonly selectedChange = signal<ChangeImpact | null>(null);

    public ngOnInit() {
        console.log({ changeeeeees: this.changes });
        const tree = buildChangeImpactTree(this.changes);
        console.log({ tree });
        this.changeImpactTreeNodes.set(tree);
    }

    public selectChangeById(id: string | null) {
        const change = this.changes.find((c) => c.id === id);
        if (!change) return;
        this.selectedChange.set(change);
    }

    public readonly changesToApply = signal<{ [key: string]: ChangeApply }>({});

    public applyChange(change: ChangeImpact, apply: ChangeApply) {
        this.changesToApply.update((current) => ({
            ...current,
            [change.id]: apply,
        }));
    }

    public applyChangeForAll(change: ChangeImpact) {
        const versionId = change.entity.versionId;
        const actionToApply = this.changesToApply()[change.id];
        if (!actionToApply) return;

        for (const otherChange of this.changes) {
            if (otherChange.entity.versionId === versionId) {
                this.applyChange(otherChange, {
                    ...actionToApply,
                    target: otherChange.target,
                });
            }
        }
    }

    public actionedChangesCount(): number {
        return this.changes.filter((change) => this.changesToApply()[change.id])
            .length;
    }

    public actionExistsForNode(node: ChangeImpactTreeNode): boolean {
        if (node.type === 'change') {
            const apply = this.changesToApply()[node.change.id];
            if (!apply) return false;

            if (apply.type === 'removed' && apply.action === 'replace') {
                return !!apply.replaceWith;
            }

            return true;
        }
        return node.children.every((child) => this.actionExistsForNode(child));
    }

    public close(data: boolean | null) {
        this.submitChanges.next({
            apply: data === true,
            confirmationSuggested: false,
            changes: Object.values(this.changesToApply()),
        });
        this.submitChanges.complete();
        this.activeModal.close();
    }
}

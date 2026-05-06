import { Component, computed, input, output, signal } from '@angular/core';
import type {
    ChangeApply,
    EditableChangeApply,
    EditableElementChangeImpact,
    ElementDto,
    Element as FuesimElement,
} from 'fuesim-digital-shared';
import { JsonPipe } from '@angular/common';
import { Immutable } from 'immer';
import { MapEditorCardComponent } from '../../../../../../shared/components/map-editor-card/map-editor-card.component';

@Component({
    selector: 'app-change-impact-edited-element-item',
    templateUrl: './edited-element-item.component.html',
    styleUrl: './edited-element-item.component.scss',
    imports: [MapEditorCardComponent, JsonPipe],
})
export class EditedElementChangeApplyItemComponent {
    public readonly change = input.required<EditableElementChangeImpact>();
    public readonly applyingChange = input<ChangeApply>();
    public readonly elementsOfNewCollection =
        input.required<Immutable<ElementDto[]>>();

    public readonly applyChange = output<EditableChangeApply>();
    public readonly applyForAll = output();

    public readonly replaceableElementTypes: FuesimElement['type'][] = [
        'vehicle',
    ];

    public readonly newValue = computed(() => {
        const applyingChange = this.applyingChange() as
            | EditableChangeApply
            | undefined;
        switch (applyingChange?.action) {
            case 'replace':
                return applyingChange.newContent;
            case 'update':
                return this.change().editedValue.template;
            case 'keep':
                return this.change().editedValue.model;
            default:
                return this.change().editedValue.template;
        }
    });

    public readonly selectedActionType = signal<
        EditableChangeApply['action'] | null
    >(null);

    public setActionType(
        action: Exclude<EditableChangeApply['action'], 'replace'>
    ) {
        this.selectedActionType.set(action);
        this.applyChange.emit({
            type: 'editable',
            action,
            marketplaceElement: this.change().entity,
            target: this.change().target,
        });
    }

    public setReplaceWith(newContent?: string) {
        const value = newContent ?? this.change().editedValue.template;

        this.selectedActionType.set('replace');
        this.applyChange.emit({
            type: 'editable',
            action: 'replace',
            marketplaceElement: this.change().entity,
            target: this.change().target,
            newContent: value,
        });
    }
}

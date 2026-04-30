import { Component, input, output, signal } from '@angular/core';
import type {
    ChangeApply,
    EditableChangeApply,
    EditableElementChangeImpact,
    ElementDto,
    Element as FuesimElement,
} from 'fuesim-digital-shared';
import { JsonPipe } from '@angular/common';
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
    public readonly elementsOfNewCollection = input.required<ElementDto[]>();

    public readonly applyChange = output<EditableChangeApply>();
    public readonly applyForAll = output();

    public readonly replaceableElementTypes: FuesimElement['type'][] = [
        'vehicle',
    ];

    public readonly selectedActionType = signal<
        EditableChangeApply['action'] | null
    >(null);

    public setActionType(action: EditableChangeApply['action']) {
        this.selectedActionType.set(action);
        this.applyChange.emit({
            type: 'editable',
            action,
            marketplaceElement: this.change().entity,
            target: this.change().target,
        });
    }
}

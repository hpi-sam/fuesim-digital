import { Component, input, output } from '@angular/core';
import type {
    ElementDto,
    Element as FuesimElement,
} from 'fuesim-digital-shared';
import {
    ChangeApply,
    EditableChangeApply,
    EditableElementChangeImpact,
} from '../change-impact-types';
import { MapEditorCardComponent } from '../../../../../../shared/components/map-editor-card/map-editor-card.component';

@Component({
    selector: 'app-change-impact-edited-element-item',
    templateUrl: './edited-element-item.component.html',
    styleUrl: './edited-element-item.component.scss',
    imports: [MapEditorCardComponent],
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

    public setActionType(action: EditableChangeApply['action']) {
        this.applyChange.emit({
            type: 'editable',
            change: this.change(),
            action,
        });
    }
}

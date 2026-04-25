import { Component, input, output } from "@angular/core";
import type { ElementDto, Element as FuesimElement } from "fuesim-digital-shared";
import { ChangeApply, RemoveChangeApply, RemovedElementChangeImpact } from "../change-impact-types";
import { MapEditorCardComponent } from "../../../../../../shared/components/map-editor-card/map-editor-card.component";

@Component({
    selector: 'app-change-impact-deleted-element-item',
    templateUrl: './deleted-element-item.component.html',
    styleUrl: './deleted-element-item.component.scss',
    imports: [MapEditorCardComponent]
})
export class DeletedElementChangeApplyItemComponent {
    public readonly change = input.required<RemovedElementChangeImpact>();
    public readonly applyingChange = input<ChangeApply>();
    public readonly elementsOfNewCollection = input.required<ElementDto[]>();

    public readonly applyChange = output<ChangeApply>();

    public readonly replaceableElementTypes: FuesimElement['type'][] = ['vehicle'];

    public setActionType(action: RemoveChangeApply['action'], replaceWith?: ElementDto) {
        if(replaceWith && action !== 'replace') return;

        this.applyChange.emit({
            type: "removed",
            change: this.change(),
            action,
            replaceWith,
        })
    }
}

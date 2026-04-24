import type { Element as FuesimElement } from '../element.js';
import type { Template as FuesimTemplate } from '../template.js';

type FuesimElementType = FuesimElement['type'];
type FuesimTemplateType = FuesimTemplate['type'];

export interface EditableValuesRegistryEntry<
    Element extends FuesimElementType,
    Template extends FuesimElementType | FuesimTemplateType = Element,
> {
    id: string;
    name: string;
    template?: Template;
    equality: (data: {
        template: Extract<FuesimTemplate, { type: Template }>;
        element: Extract<FuesimElement, { type: Element }>;
    }) => boolean;
    /**
     * How to bring the values over to the new element version
     */
    keep: <E extends Extract<FuesimElement, { type: Element }>>(data: {
        template: Extract<FuesimTemplate, { type: Template }>;
        newElement: E;
        oldElement: E;
    }) => E;
}

const editableValuesRegistry: {
    [model in FuesimElementType]?: {
        [template in
            | FuesimElementType
            | FuesimTemplateType]?: EditableValuesRegistryEntry<
            model,
            template
        >[];
    };
} = {};

export function registerEditableValue<
    Element extends FuesimElementType,
    Template extends FuesimElementType | FuesimTemplateType,
>(
    data: {
        model: Element;
        template: Template;
    },
    entry: EditableValuesRegistryEntry<Element, Template>[]
): void {
    editableValuesRegistry[data.model] ??= {};
    editableValuesRegistry[data.model]![data.template] ??= [];

    const modelEntries = editableValuesRegistry[data.model]!;
    const modelTemplateEntries = modelEntries[data.template]!;
    modelTemplateEntries.push(...entry);
}

export function getEditableValueCheckers<
    Element extends FuesimElementType,
    Template extends FuesimElementType | FuesimTemplateType,
>(
    model: Element,
    template: Template
): EditableValuesRegistryEntry<Element, Template>[] {
    return editableValuesRegistry[model]?.[template] ?? [];
}

export function checkEditableValueEdited(data: {
    template: FuesimTemplate;
    element: FuesimElement;
}) {
    const { template, element } = data;
    const checkers = getEditableValueCheckers(element.type, template.type);
    const editedValues: { id: string; name: string }[] = [];
    for (const { id, name, equality } of checkers) {
        if (!equality({ template, element })) {
            editedValues.push({
                id,
                name,
            });
        }
    }
    return editedValues;
}

import type { Immutable } from 'immer';
import type { ElementVersionId } from '../../marketplace/models/versioned-id-schema.js';
import type { Element as FuesimElement } from '../element.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import type { Template as FuesimTemplate } from './../template.js';

type FuesimCombined = FuesimElement | FuesimTemplate;

type FuesimElementType = FuesimElement['type'];
type FuesimTemplateType = FuesimTemplate['type'];
type FuesimCombinedType = FuesimElementType | FuesimTemplateType;

type SpecificModel<Model extends FuesimCombinedType> = Extract<
    FuesimCombined,
    { type: Model }
>;

interface ReplaceOpts {
    old: ElementVersionId;
    new: ElementVersionId | null;
}

export interface DependencyRegistryEntry<Model extends FuesimCombined> {
    detect: (data: Model) => ElementVersionId[];
    replace: (data: Model, replace: ReplaceOpts[]) => Model;
}

type DependencyRegistry = {
    [ModelType in FuesimCombinedType]?: DependencyRegistryEntry<
        SpecificModel<ModelType>
    >;
};

const dependencyRegistry: DependencyRegistry = {};

function setDependencyRegistryEntry<ModelType extends FuesimCombinedType>(
    modeltype: ModelType,
    entry: DependencyRegistryEntry<SpecificModel<ModelType>>
): void {
    dependencyRegistry[modeltype] = entry as DependencyRegistry[ModelType];
}

function getDependencyRegistryEntry<ModelType extends FuesimCombinedType>(
    modeltype: ModelType
): DependencyRegistryEntry<SpecificModel<ModelType>> | undefined {
    return dependencyRegistry[modeltype];
}

export function registerDependency<ModelType extends FuesimCombinedType>(
    modeltype: ModelType,
    entry: DependencyRegistryEntry<SpecificModel<ModelType>>
): void {
    setDependencyRegistryEntry(modeltype, entry);
}

export function getDependencyChecker<ModelType extends FuesimCombinedType>(
    model: ModelType
): DependencyRegistryEntry<SpecificModel<ModelType>> | undefined {
    return getDependencyRegistryEntry(model);
}

export function getElementDependencies<Model extends FuesimCombined>(
    data: Model
): ElementVersionId[] {
    const checker = getDependencyChecker(data.type);
    if (!checker) {
        return [];
    }
    return checker.detect(data);
}

export function replaceDependencies<Model extends FuesimCombined>(
    data: Immutable<Model>,
    replace: ReplaceOpts[]
): Immutable<Model> {
    const checker = getDependencyChecker(data.type);
    if (!checker) {
        return data;
    }
    return checker.replace(cloneDeepMutable(data), replace) as Immutable<Model>;
}

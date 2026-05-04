import type { ChangeImpact, ElementVersionId } from 'fuesim-digital-shared';

interface BaseNode {
    name: string;
    value: string;
    disabled?: boolean;
}

interface FolderNode extends BaseNode {
    type: 'folder';
    children: ChangeImpactTreeNode[];
    expanded: boolean;
}
interface ChangeNode extends BaseNode {
    type: 'change';
    change: ChangeImpact;
}

export type ChangeImpactTreeNode = ChangeNode | FolderNode;

export function buildChangeImpactTree(
    changes: ChangeImpact[]
): ChangeImpactTreeNode[] {
    const elementsOnMap: FolderNode = {
        type: 'folder',
        name: 'Elemente auf Karte',
        value: 'elements-on-map',
        children: [],
        expanded: true,
    };

    const alarmGroupChanges: {
        [alarmGroupId: string]: { alarmGroupName: string; nodes: ChangeNode[] };
    } = {};

    const editChanges: {
        [elementVersionId in ElementVersionId]: {
            elementTitle: string;
            changes: ChangeNode[];
        };
    } = {};

    for (const change of changes) {
        console.log({ change });
        if (change.type === 'added') continue;

        switch (change.target.kind) {
            case 'map': {
                switch (change.type) {
                    case 'updated': {
                        console.log('Element auf Karte geändert', { change });
                        editChanges[change.entity.versionId] ??= {
                            elementTitle: change.entity.title,
                            changes: [],
                        };

                        editChanges[change.entity.versionId]!.changes.push({
                            type: 'change',
                            name: change.entity.title,
                            value: change.id,
                            change,
                        });
                        break;
                    }
                    case 'removed': {
                        elementsOnMap.children.push({
                            type: 'change',
                            name: change.entity.title,
                            value: change.id,
                            change,
                        });
                        break;
                    }
                }

                break;
            }
            case 'alarm-group-vehicle': {
                alarmGroupChanges[change.target.alarmGroupId] ??= {
                    alarmGroupName: change.target.alarmGroupName,
                    nodes: [],
                };
                alarmGroupChanges[change.target.alarmGroupId]!.nodes.push({
                    type: 'change',
                    name: change.entity.title,
                    value: change.id,
                    change,
                });
            }
        }
    }

    const editedElements: FolderNode[] = Object.entries(editChanges).map(
        ([elementVersionId, entry]) => ({
            type: 'folder',
            name: entry.elementTitle,
            value: elementVersionId,
            children: entry.changes,
            expanded: true,
        })
    );

    elementsOnMap.children.push(...editedElements);
    elementsOnMap.children.sort((a, b) => a.name.localeCompare(b.name));

    const elementsInAlarmGroups: FolderNode = {
        type: 'folder',
        name: 'Elemente in Alarmgruppen',
        value: 'elements-in-alarm-groups',
        children: Object.entries(alarmGroupChanges).map(
            ([alarmGroupId, { nodes, alarmGroupName }]) => ({
                type: 'folder',
                name: `Alarmgruppe ${alarmGroupName}`,
                value: alarmGroupId,
                children: nodes,
                expanded: true,
            })
        ),
        expanded: true,
    };

    return [
        ...(elementsOnMap.children.length > 0 ? [elementsOnMap] : []),
        ...(elementsInAlarmGroups.children.length > 0
            ? [elementsInAlarmGroups]
            : []),
    ];
}

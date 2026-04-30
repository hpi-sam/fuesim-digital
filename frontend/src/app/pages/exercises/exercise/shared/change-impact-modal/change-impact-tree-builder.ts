import type { ChangeImpact } from 'fuesim-digital-shared';

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
    const baseNodes: FolderNode[] = [];

    const elementsOnMap: FolderNode = {
        type: 'folder',
        name: 'Elemente auf Karte',
        value: 'elements-on-map',
        children: [],
        expanded: true,
    };

    baseNodes.push(elementsOnMap);

    const elementsInAlarmGroups: FolderNode = {
        type: 'folder',
        name: 'Elemente in Alarmgruppen',
        value: 'elements-in-alarm-groups',
        children: [],
        expanded: true,
    };

    const alarmGroupChanges: {
        [alarmGroupId: string]: { alarmGroupName: string; nodes: ChangeNode[] };
    } = {};

    for (const change of changes) {
        console.log({ change });
        if (change.type === 'added') continue;

        switch (change.target.kind) {
            case 'map': {
                console.log('Adding change to elements on map', { change });
                elementsOnMap.children.push({
                    type: 'change',
                    name: change.entity.title,
                    value: change.id,
                    change,
                });
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

    elementsInAlarmGroups.children = Object.entries(alarmGroupChanges).map(
        ([alarmGroupId, { nodes, alarmGroupName }]) => ({
            type: 'folder',
            name: `Alarmgruppe ${alarmGroupName}`,
            value: alarmGroupId,
            children: nodes,
            expanded: true,
        })
    );

    if (elementsInAlarmGroups.children.length > 0) {
        baseNodes.push(elementsInAlarmGroups);
    }

    return baseNodes;
}

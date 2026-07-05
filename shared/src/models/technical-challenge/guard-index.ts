import { cloneDeep } from 'lodash-es';
import type { TaskType } from '../task-type.js';
import type { StateMachine, Guard } from './state-machine.js';
import type { GuardId, StateMachineId, TransitionId } from './ids.js';

interface GuardIndexEntry {
    guard: Guard;
    parent: GuardId | null;
    currentValue: boolean | null;
    transition: TransitionId;
}

export interface CurrentValue {
    value: boolean;
    valid: boolean;
}

export class GuardIndex {
    private static readonly indices: Map<StateMachineId, GuardIndex> =
        new Map();

    private readonly guards: Map<GuardId, GuardIndexEntry>;
    private readonly taskGuardsOf: Map<TaskType['id'], GuardId[]>;
    constructor() {
        this.guards = new Map();
        this.taskGuardsOf = new Map();
    }

    public static getIndex(stateMachine: StateMachine): GuardIndex {
        let index = this.indices.get(stateMachine.id);
        if (!index) {
            index = this.buildIndex(stateMachine);
            this.indices.set(stateMachine.id, index);
        }
        return index;
    }

    public static invalidateIndex(stateMachineId: StateMachineId): void {
        this.indices.delete(stateMachineId);
    }

    private static buildIndex(stateMachine: StateMachine): GuardIndex {
        const index = new GuardIndex();

        for (const state of Object.values(stateMachine.states)) {
            for (const transition of Object.values(state.outgoingTransitions)) {
                index.visitGuard(
                    cloneDeep(transition.guard),
                    transition.id,
                    null
                );
            }
        }

        return index;
    }

    private visitGuard(
        guard: Guard,
        transitionId: TransitionId,
        parentId: GuardId | null
    ) {
        const entry: GuardIndexEntry = {
            currentValue: null,
            guard,
            parent: parentId,
            transition: transitionId,
        };
        this.setEntry(guard.id, entry);

        switch (guard.type) {
            case 'taskGuard': {
                let leaves = this.taskGuardsOf.get(guard.taskId);
                if (!leaves) {
                    leaves = [];
                    this.taskGuardsOf.set(guard.taskId, leaves);
                }
                leaves.push(guard.id);
                break;
            }
            case 'andGuard':
                for (const child of guard.guards)
                    this.visitGuard(child, transitionId, guard.id);
                break;
            case 'notGuard':
                this.visitGuard(guard.guard, transitionId, guard.id);
                break;
            case 'timerGuard':
                break;
        }
    }

    // getters and setters
    public getEntry(guardId: GuardId): GuardIndexEntry | null {
        return this.guards.get(guardId) ?? null;
    }

    private assertingGetGuard(guardId: GuardId): GuardIndexEntry {
        const entry = this.getEntry(guardId);
        if (!entry) {
            throw new Error(
                "setter called on 'guardId' without existing entry"
            );
        }
        return entry;
    }

    public setEntry(guardId: GuardId, entry: GuardIndexEntry): void {
        this.guards.set(guardId, entry);
    }

    public getGuard(guardId: GuardId): Guard | null {
        return this.getEntry(guardId)?.guard ?? null;
    }

    public setGuard(guardId: GuardId, guard: Guard): void {
        const entry = this.assertingGetGuard(guardId);
        entry.guard = guard;
        this.setEntry(guardId, entry);
    }

    public getParentId(guardId: GuardId): GuardId | null {
        return this.getEntry(guardId)?.parent ?? null;
    }

    public setParentId(guardId: GuardId, parentId: GuardId): void {
        const entry = this.assertingGetGuard(guardId);
        entry.parent = parentId;
        this.setEntry(guardId, entry);
    }

    public getCurrentValue(guardId: GuardId): boolean | null {
        return this.getEntry(guardId)?.currentValue ?? null;
    }

    public setCurrentValue(guardId: GuardId, value: boolean): void {
        const entry = this.assertingGetGuard(guardId);
        entry.currentValue = value;
        this.setEntry(guardId, entry);
    }

    public getTransitionId(guardId: GuardId): TransitionId | null {
        return this.getEntry(guardId)?.transition ?? null;
    }

    public setTransitionId(guardId: GuardId, transitionId: TransitionId): void {
        const entry = this.assertingGetGuard(guardId);
        entry.transition = transitionId;
        this.setEntry(guardId, entry);
    }

    public getTaskGuardsOf(taskId: TaskType['id']): GuardId[] {
        return this.taskGuardsOf.get(taskId) ?? [];
    }
}

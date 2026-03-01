import type { JsonObject, SocketResponse } from 'fuesim-digital-shared';
import type { Immutable } from 'immer';
import { isEqual } from 'lodash-es';

/**
 * This class handles optimistic actions on a state.
 * The following assertions have to be met:
 * - the state is immutable and can only be modified via {@link setState } and {@link applyAction }
 * - {@link  applyAction} on the same state is a pure function
 * - if a proposedAction succeeds, the action should be applied to the state via {@link performAction}
 *     - this performAction must be called before the action resolves successfully
 */
export class OptimisticActionHandler<
    Action extends JsonObject,
    State extends JsonObject,
    ServerResponse extends SocketResponse,
> {
    constructor(
        /**
         * This function has to set the state synchronously to another value
         */
        private readonly setState: (state: Immutable<State>) => void,
        /**
         * Returns the current state synchronously
         * It is expected that the first `getState` is in sync with the server
         */
        private readonly getState: () => Immutable<State>,
        /**
         * Applies (reduces) the action to the state
         * It could happen that the action is not applicable to the state.
         * This happens e.g. if an optimistic action is applied, but the server state changed in the meantime.
         * In this case the action can just be ignored.
         */
        private readonly applyAction: (action: Immutable<Action>) => void,
        /**
         * Sends the action to the server and resolves with the servers response
         */
        private readonly sendAction: (
            action: Immutable<Action>
        ) => Promise<ServerResponse>
    ) {}

    /**
     * The state that is confirmed to be valid by the server.
     * It is only assembled by the first `getState` and actions that came from the server via {@link performAction}
     */
    private serverState = this.getState();

    /**
     * The actions that have already been optimistically applied to the state and have been send to the server
     * The first element is the action that was first applied to the state
     *
     * {@link getState()} === {@link serverState} + ...{@link optimisticallyAppliedActions}
     */
    private readonly optimisticallyAppliedActions: Immutable<Action>[] = [];

    /**
     * Remove the first action in {@link optimisticallyAppliedActions} that is deepEqual to the given @param action
     */
    private removeFirstOptimisticAction(action: Immutable<Action>) {
        for (let i = 0; i < this.optimisticallyAppliedActions.length; i++) {
            if (
                this.actionsAreEqual(
                    this.optimisticallyAppliedActions[i]!,
                    action
                )
            ) {
                this.optimisticallyAppliedActions.splice(i, 1);
                return;
            }
        }
    }

    /**
     *
     * @param proposedAction the action that should be proposed to the server
     * @param beOptimistic wether the action should be applied before the server responds (in a way that the state doesn't get corrupted because of another action order on the server side)
     * The actions of optimistically applied actions must not be changed by the server.
     * This means that e.g. all actions with nondeterministic values that are added by the server must be send with {@link beOptimistic} = false.
     * @returns the response of the server
     */
    public async proposeAction(
        proposedAction: Immutable<Action>,
        beOptimistic: boolean
    ): Promise<ServerResponse> {
        if (!beOptimistic) {
            return this.sendAction(proposedAction);
        }
        this.optimisticallyAppliedActions.push(proposedAction);
        this.applyAction(proposedAction);
        const response = await this.sendAction(proposedAction);
        if (response.success) {
            // If the response is successful the actions has already been removed by the `performAction` function before.
            return response;
        }
        // Remove the action from the applied actions
        this.removeFirstOptimisticAction(proposedAction);
        this.setState(this.serverState);
        this.optimisticallyAppliedActions.forEach((_action) => {
            this.applyAction(_action);
        });
        return response;
    }

    /**
     * Only and all actions that are send from the server should be applied via this function
     * It is expected that successfully proposed actions are applied via this function too
     * @param action
     */
    public performAction(action: Immutable<Action>) {
        // This is a shortcut to improve performance for obvious cases - If you remove it the code is still correct
        if (this.optimisticallyAppliedActions.length === 0) {
            this.applyAction(action);
            this.serverState = this.getState();
            return;
        }

        // This is a shortcut to improve performance for obvious cases - If you remove it the code is still correct

        if (
            // If there are more optimistic actions, the state would already be correct, but we have no way to set the correct saveState
            this.optimisticallyAppliedActions.length === 1 &&
            this.actionsAreEqual(this.optimisticallyAppliedActions[0]!, action)
        ) {
            // Remove the already applied action
            this.optimisticallyAppliedActions.shift();
            // The state is already up to date
            this.serverState = this.getState();
            return;
        }
        // Here comes the general and "safe" way:

        // Remove the first matching optimisticAction (if there is one)
        this.removeFirstOptimisticAction(action);
        // Reset the state
        this.setState(this.serverState);
        // Apply the server action
        this.applyAction(action);
        // Save the state
        this.serverState = this.getState();
        // Apply the remaining optimistic actions
        this.optimisticallyAppliedActions.forEach((_action) => {
            this.applyAction(_action);
        });
    }

    /**
     * This is a workaround until https://www.typescriptlang.org/tsconfig#exactOptionalPropertyTypes is activated in our codebase
     * If we send an action where an optional property is deleted, it is not equal to the action with this property set to undefined.
     */
    private actionsAreEqual(
        action1: Immutable<Action>,
        action2: Immutable<Action>
    ) {
        return isEqual(
            // This removes all undefined values from the action
            JSON.parse(JSON.stringify(action1)),
            JSON.parse(JSON.stringify(action2))
        );
    }
}

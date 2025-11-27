import type { SocketResponse } from 'digital-fuesim-manv-shared';
import { OptimisticActionHandler } from './optimistic-action-handler';

class AddLetterAction {
    public readonly type = 'addLetter';
    constructor(public readonly letter: string) {}
}

/**
 * A helper class for testing the optimistic action handler.
 */
class WordStateManager {
    /**
     * The current immutable state
     */
    public state = { word: '' };

    /**
     * Applies an action to the (immutable) state
     */
    public applyAction(action: AddLetterAction) {
        this.state = { word: this.state.word + action.letter };
    }

    /**
     * The proposed actions that are still waiting for a response
     */
    private readonly proposedActions = new Map<
        number,
        (value: SocketResponse) => void
    >();

    /**
     * (Would) Send a proposed action to the server
     */
    public async sendAction(
        key: number,
        action: AddLetterAction
    ): Promise<SocketResponse> {
        if (this.proposedActions.has(key)) {
            throw new Error(`Action with key ${key} already sent`);
        }
        return new Promise((resolve) => {
            this.proposedActions.set(key, resolve);
        });
    }

    /**
     * Responds to the first proposed action that hasn't been responded to yet
     * Be aware that the callbacks to the response promise have not been called yet
     */
    public respondToProposedAction(key: number, response: SocketResponse) {
        const callback = this.proposedActions.get(key);
        if (!callback) {
            throw new Error(`No action with key ${key} found`);
        }
        callback(response);
        this.proposedActions.delete(key);
    }

    public allActionsWereRespondedTo() {
        return this.proposedActions.size === 0;
    }
}

const successResponse: SocketResponse = { success: true };
const errorResponse: SocketResponse = {
    success: false,
    message: 'error',
    expected: false,
};

describe('OptimisticActionHandler', () => {
    let actionKey: number;
    let wordStateManager: WordStateManager;
    let optimisticActionHandler: OptimisticActionHandler<
        AddLetterAction,
        { word: string },
        SocketResponse
    >;

    /**
     * Use this function to test the optimistic action handlers ability to propose actions.
     * @returns an object with the response and nested functions that simulate the server response
     */
    function proposeAction(action: AddLetterAction, beOptimistic: boolean) {
        const key = actionKey;
        // TODO: We currently assume that the action is send synchronously
        const response = optimisticActionHandler.proposeAction(
            action,
            beOptimistic
        );
        return {
            response,
            performAction: () => {
                optimisticActionHandler.performAction(action);
                return {
                    resolveProposal: async () => {
                        wordStateManager.respondToProposedAction(
                            key,
                            successResponse
                        );
                        await response;
                    },
                };
            },
            rejectProposal: async () => {
                wordStateManager.respondToProposedAction(key, errorResponse);
                await response;
            },
        };
    }

    function performAction(action: AddLetterAction) {
        optimisticActionHandler.performAction(action);
    }

    beforeEach(() => {
        actionKey = 0;
        wordStateManager = new WordStateManager();
        optimisticActionHandler = new OptimisticActionHandler(
            (newState) => (wordStateManager.state = newState),
            () => wordStateManager.state,
            (action) => wordStateManager.applyAction(action),
            async (action) => wordStateManager.sendAction(actionKey++, action)
        );
    });

    afterEach(() => {
        expect(wordStateManager.allActionsWereRespondedTo()).toBe(true);
    });

    it.each([
        { success: true, optimistic: true },
        { success: true, optimistic: false },
        { success: false, optimistic: true },
        { success: false, optimistic: false },
    ])(
        'returns the response of a proposed action with %p',
        async ({ success, optimistic }) => {
            const actionProposal = proposeAction(
                new AddLetterAction('a'),
                optimistic
            );
            if (success) {
                // This await here is not really necessary, because we await the response
                await actionProposal.performAction().resolveProposal();
                expect(await actionProposal.response).toEqual(successResponse);
                expect(wordStateManager.state.word).toEqual('a');
            } else {
                await actionProposal.rejectProposal();
                expect(await actionProposal.response).toEqual(errorResponse);
                expect(wordStateManager.state.word).toEqual('');
            }
        }
    );

    it('performs actions', () => {
        expect(wordStateManager.state.word).toEqual('');

        performAction(new AddLetterAction('a'));
        expect(wordStateManager.state.word).toEqual('a');

        performAction(new AddLetterAction('b'));
        expect(wordStateManager.state.word).toEqual('ab');
    });

    it('proposes a single optimistic proposal', async () => {
        const actionProposal = proposeAction(new AddLetterAction('a'), true);
        // Should be synchronously applied
        expect(wordStateManager.state.word).toEqual('a');
        const performedActionProposal = actionProposal.performAction();
        expect(wordStateManager.state.word).toEqual('a');
        await performedActionProposal.resolveProposal();
        expect(wordStateManager.state.word).toEqual('a');
    });

    it('handles a single optimistic proposals that fails', async () => {
        const actionProposal = proposeAction(new AddLetterAction('a'), true);
        expect(wordStateManager.state.word).toEqual('a');
        await actionProposal.rejectProposal();
        expect(wordStateManager.state.word).toEqual('');
    });

    it('handles multiple equal optimistic proposals', async () => {
        const actionProposal1 = proposeAction(new AddLetterAction('a'), true);
        expect(wordStateManager.state.word).toEqual('a');
        const actionProposal2 = proposeAction(new AddLetterAction('a'), true);
        expect(wordStateManager.state.word).toEqual('aa');

        const performedActionProposal1 = actionProposal1.performAction();
        expect(wordStateManager.state.word).toEqual('aa');
        const performedActionProposal2 = actionProposal2.performAction();
        expect(wordStateManager.state.word).toEqual('aa');

        await performedActionProposal1.resolveProposal();
        expect(wordStateManager.state.word).toEqual('aa');
        await performedActionProposal2.resolveProposal();
        expect(wordStateManager.state.word).toEqual('aa');
    });

    it('handles multiple equal optimistic proposals if one fails', async () => {
        const actionProposal1 = proposeAction(new AddLetterAction('a'), true);
        expect(wordStateManager.state.word).toEqual('a');
        const actionProposal2 = proposeAction(new AddLetterAction('a'), true);
        expect(wordStateManager.state.word).toEqual('aa');

        const performedActionProposal1 = actionProposal1.performAction();
        expect(wordStateManager.state.word).toEqual('aa');

        await performedActionProposal1.resolveProposal();
        expect(wordStateManager.state.word).toEqual('aa');
        await actionProposal2.rejectProposal();
        expect(wordStateManager.state.word).toEqual('a');
    });

    it('handles an optimistic proposal with a performAction from the server in between', async () => {
        const actionProposal = proposeAction(new AddLetterAction('a'), true);
        expect(wordStateManager.state.word).toEqual('a');
        performAction(new AddLetterAction('b'));
        expect(wordStateManager.state.word).toEqual('ba');
        const performedActionProposal = actionProposal.performAction();
        expect(wordStateManager.state.word).toEqual('ba');
        await performedActionProposal.resolveProposal();
        expect(wordStateManager.state.word).toEqual('ba');
    });

    it('handles multiple optimistic and non-optimistic proposals', async () => {
        // Propose actions
        const actionProposalA = proposeAction(new AddLetterAction('a'), true);
        expect(wordStateManager.state.word).toEqual('a');

        const actionProposalB = proposeAction(new AddLetterAction('b'), false);
        expect(wordStateManager.state.word).toEqual('a');

        const actionProposalC = proposeAction(new AddLetterAction('c'), true);
        expect(wordStateManager.state.word).toEqual('ac');

        const actionProposalD = proposeAction(new AddLetterAction('d'), false);
        expect(wordStateManager.state.word).toEqual('ac');

        // The server reacts to the proposals
        await actionProposalA.performAction().resolveProposal();
        expect(wordStateManager.state.word).toEqual('ac');

        await actionProposalB.performAction().resolveProposal();
        expect(wordStateManager.state.word).toEqual('abc');

        await actionProposalC.performAction().resolveProposal();
        expect(wordStateManager.state.word).toEqual('abc');

        await actionProposalD.performAction().resolveProposal();
        expect(wordStateManager.state.word).toEqual('abcd');
    });

    it('handles a complicated sequence of actions', async () => {
        const actionProposalA = proposeAction(new AddLetterAction('a'), true);
        expect(wordStateManager.state.word).toEqual('a');
        performAction(new AddLetterAction('b'));
        expect(wordStateManager.state.word).toEqual('ba');
        performAction(new AddLetterAction('c'));
        expect(wordStateManager.state.word).toEqual('bca');
        performAction(new AddLetterAction('c'));
        expect(wordStateManager.state.word).toEqual('bcca');
        const actionProposalD1 = proposeAction(new AddLetterAction('d'), false);
        expect(wordStateManager.state.word).toEqual('bcca');
        const actionProposalD2 = proposeAction(new AddLetterAction('d'), true);
        expect(wordStateManager.state.word).toEqual('bccad');
        performAction(new AddLetterAction('e'));
        expect(wordStateManager.state.word).toEqual('bccead');
        const performedActionProposalA = actionProposalA.performAction();
        expect(wordStateManager.state.word).toEqual('bccead');
        const performedActionProposalD1 = actionProposalD1.performAction();
        expect(wordStateManager.state.word).toEqual('bccead');
        await actionProposalD2.rejectProposal();
        expect(wordStateManager.state.word).toEqual('bccead');
        await performedActionProposalD1.resolveProposal();
        expect(wordStateManager.state.word).toEqual('bccead');
        performAction(new AddLetterAction('c'));
        expect(wordStateManager.state.word).toEqual('bcceadc');
        await performedActionProposalA.resolveProposal();
        expect(wordStateManager.state.word).toEqual('bcceadc');
    });

    it('handles multiple optimistic proposals with a performAction', async () => {
        const actionProposalA = proposeAction(new AddLetterAction('a'), true);
        expect(wordStateManager.state.word).toEqual('a');
        const actionProposalB = proposeAction(new AddLetterAction('b'), true);
        expect(wordStateManager.state.word).toEqual('ab');
        const actionProposalC = proposeAction(new AddLetterAction('c'), true);
        expect(wordStateManager.state.word).toEqual('abc');

        // There is no way for us to know whether this is the proposal to our optimistic action or an additional action from the server -> remove it
        performAction(new AddLetterAction('b'));
        expect(wordStateManager.state.word).toEqual('bac');

        await actionProposalA.performAction().resolveProposal();
        expect(wordStateManager.state.word).toEqual('bac');
        await actionProposalB.performAction().resolveProposal();
        expect(wordStateManager.state.word).toEqual('babc');
        await actionProposalC.performAction().resolveProposal();
        expect(wordStateManager.state.word).toEqual('babc');
    });

    it('handles multiple optimistic proposals with a performAction and a rejected proposal', async () => {
        const actionProposalA = proposeAction(new AddLetterAction('a'), true);
        expect(wordStateManager.state.word).toEqual('a');
        const actionProposalB = proposeAction(new AddLetterAction('b'), true);
        expect(wordStateManager.state.word).toEqual('ab');
        const actionProposalC = proposeAction(new AddLetterAction('c'), true);
        expect(wordStateManager.state.word).toEqual('abc');

        performAction(new AddLetterAction('b'));
        expect(wordStateManager.state.word).toEqual('bac');

        await actionProposalA.performAction().resolveProposal();
        expect(wordStateManager.state.word).toEqual('bac');
        await actionProposalB.rejectProposal();
        expect(wordStateManager.state.word).toEqual('bac');
        await actionProposalC.performAction().resolveProposal();
        expect(wordStateManager.state.word).toEqual('bac');
    });
});

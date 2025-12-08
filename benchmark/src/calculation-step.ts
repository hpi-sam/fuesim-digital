import { Step } from './step.js';

/**
 * A calculation step can be used to calculate new values from the state.
 * The printed out value is the return value of the calculation function
 */
export class CalculationStep<
    State extends {
        [StepName: string]: any | undefined;
    },
    Name extends keyof State = keyof State,
    Value extends State[Name] = State[Name],
> extends Step<State> {
    public constructor(
        name: Name,
        public readonly calculate: (state: State) => Value,
        printColumn = true
    ) {
        super(name, printColumn);
    }

    public runStep(stepState: State) {
        return this.calculate(stepState);
    }

    public formatValue(value: Value) {
        return value;
    }
}

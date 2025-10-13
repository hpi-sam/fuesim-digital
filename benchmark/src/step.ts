export abstract class Step<
    State extends {
        [StepName: string]: any | undefined;
    },
    Name extends keyof State = keyof State,
    Value extends State[Name] = State[Name],
> {
    protected constructor(
        public readonly name: Name,
        /**
         * Whether a column with the values of this step should be added to the printed table at the end
         */
        private readonly printColumn: boolean
    ) {}

    protected abstract runStep(state: State): NonNullable<Value>;

    /**
     * This function is expected to modify the state.
     * It can throw an error to stop all steps that come after it.
     * It can print out information to the console.
     */
    public run(state: State) {
        state[this.name] = this.runStep(state);
    }

    protected abstract formatValue(value: NonNullable<Value>): any;

    public getColumnToPrint(state: State): {
        [columnName: string]: any;
    } {
        const value = state[this.name];
        return this.printColumn
            ? {
                  [this.name]:
                      value === undefined
                          ? // If the value is undefined, the step was not run (probably because of an error in a previous step)
                            undefined
                          : this.formatValue(value),
              }
            : {};
    }
}

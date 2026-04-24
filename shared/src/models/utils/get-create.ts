import type { Constructor } from '../../utils/constructor.js';

/**
 * Models must be JSON objects. This means they mustn't have any functions.
 * The `prototype` of a class contains functions (e.g. `constructor`).
 * We still need the constructor to create a new instance of the class with a prototype, to be able to use `class-validator`.
 * We solve this by using a static factory function `create` in the class.
 * In addition this instance is frozen, to prevent accidental mutation.
 *
 * @example
 * ```typescript
 *   export class Coordinates {
 *       @IsNumber()
 *       public a: number;
 *       /**
 *        * @_deprecated Use {@link create} instead
 *        *_/
 *       constructor(a: number) {
 *           this.a = a;
 *       }
 *       static readonly create = getCreate(this);
 *   }
 * ```
 * @param aClass The class whose static create method is to be returned
 * @returns a function that creates a new immutable instance of {@link aClass} without a prototype
 */
export function getCreate<T extends Constructor>(aClass: T) {
    return (...args: ConstructorParameters<T>): InstanceType<T> => {
        const instance = {
            ...new aClass(...args),
        };
        Object.freeze(instance);
        return instance;
    };
}

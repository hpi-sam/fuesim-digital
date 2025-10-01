import type { GenericPropertyDecorator } from './generic-property-decorator.js';

// Source: https://github.com/nestjs/nest/blob/a448f53b7746d35bf25a18f1759c971e5b7fea1c/packages/common/decorators/core/apply-decorators.ts

/**
 * @param decorators one or more decorators (e.g., `IsString(...)`)
 * @returns a new decorator that applies all the provided decorators
 *
 * Useful to build new decorators (or a decorator factory) encapsulating multiple decorators
 */
export function combineDecorators<T, Each extends boolean>(
    ...decorators: Array<
        | ClassDecorator
        | GenericPropertyDecorator<T, Each>
        | MethodDecorator
        | PropertyDecorator
    >
) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    return <TFunction extends Function, Y>(
        target: TFunction | object,
        propertyKey?: string | symbol,
        descriptor?: TypedPropertyDescriptor<Y>
    ) => {
        for (const decorator of decorators) {
            if (target instanceof Function && !descriptor) {
                (decorator as ClassDecorator)(target);
                continue;
            }
            (decorator as MethodDecorator | PropertyDecorator)(
                target,
                propertyKey!,
                descriptor!
            );
        }
    };
}

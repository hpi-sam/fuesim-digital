import { IsNumber, IsString, IsUUID, ValidateIf } from 'class-validator';
import type { UUID } from '../utils/index.js';
import { uuid, uuidValidationOptions } from '../utils/index.js';
import { IsValue } from '../utils/validators/index.js';
import { IsIdMap } from '../utils/validators/is-id-map.js';
import { getCreate } from './utils/index.js';
import { AlarmGroupVehicle } from './utils/alarm-group-vehicle.js';

export class AlarmGroup {
    @IsUUID(4, uuidValidationOptions)
    public readonly id: UUID = uuid();

    @IsValue('alarmGroup' as const)
    public readonly type = 'alarmGroup';

    @IsString()
    public readonly name: string;

    @IsIdMap(AlarmGroupVehicle)
    public alarmGroupVehicles: { readonly [key: UUID]: AlarmGroupVehicle } = {};

    @IsNumber()
    public readonly triggerCount: number = 0;

    @ValidateIf((_, value) => value !== null)
    @IsNumber()
    public readonly triggerLimit: number | null = null;

    /**
     * @deprecated Use {@link create} instead
     */
    constructor(name: string) {
        this.name = name;
    }

    static readonly create = getCreate(this);
}

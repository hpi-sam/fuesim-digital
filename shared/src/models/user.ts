import { IsString } from 'class-validator';
import { IsValue } from '../utils/validators/is-value.js';
import { getCreate } from './utils/get-create.js';

export class User {
    @IsString()
    public readonly id;

    @IsValue('user' as const)
    public readonly type = 'user';

    @IsString()
    public readonly username: string;

    /**
     * @param position top-left position
     * @deprecated Use {@link create} instead
     */
    constructor(id: string, username: string) {
        this.id = id;
        this.username = username;
    }

    static readonly create = getCreate(this);
}

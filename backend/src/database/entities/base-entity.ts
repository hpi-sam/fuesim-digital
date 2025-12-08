import { IsUUID } from 'class-validator';
import type { UUID } from 'digital-fuesim-manv-shared';
import { uuidValidationOptions } from 'digital-fuesim-manv-shared';
import { PrimaryGeneratedColumn } from 'typeorm';
import type { NormalType } from '../normal-type.js';

export abstract class BaseEntity<
    TSelf extends BaseEntity<TSelf, NormalEntity>,
    NormalEntity extends NormalType<any, TSelf>,
> {
    @PrimaryGeneratedColumn('uuid')
    @IsUUID(4, uuidValidationOptions)
    public id!: UUID;
}

import { and, asc, getTableColumns, eq, inArray } from 'drizzle-orm';
import type {
    OrganisationId,
    OrganisationMembershipRole,
} from 'fuesim-digital-shared';
import type { OrganisationInsert } from '../schema.js';
import {
    organisationMembershipTable,
    organisationTable,
    userTable,
} from '../schema.js';
import { BaseRepository } from './base-repository.js';

export class OrganisationRepository extends BaseRepository {
    public async getOrganisationsForUser(userId: string) {
        const subquery = this.databaseConnection
            .select()
            .from(organisationMembershipTable)
            .where(eq(organisationMembershipTable.userId, userId))
            .as('memberships');
        return this.databaseConnection
            .select({
                ...getTableColumns(organisationTable),
                userRole: subquery.role,
            })
            .from(organisationTable)
            .innerJoin(
                subquery,
                and(eq(organisationTable.id, subquery.organisationId))
            )
            .orderBy(asc(organisationTable.name));
    }

    public async createOrganisation(data: OrganisationInsert) {
        return this.onlySingle(
            await this.databaseConnection
                .insert(organisationTable)
                .values(data)
                .returning()
        );
    }

    public async addMemberToOrganisation(
        organisationId: OrganisationId,
        userId: string,
        role: OrganisationMembershipRole = 'viewer'
    ) {
        return this.onlySingle(
            await this.databaseConnection
                .insert(organisationMembershipTable)
                .values({
                    organisationId,
                    userId,
                    role,
                })
                .onConflictDoUpdate({
                    target: [organisationMembershipTable.id, userTable.id],
                    set: { role },
                })
                .returning()
        );
    }

    public async getOrganisationById(id: OrganisationId) {
        return this.onlySingle(
            await this.databaseConnection
                .select()
                .from(organisationTable)
                .where(eq(organisationTable.id, id))
        );
    }

    public async getOrganisationMembersById(id: OrganisationId) {
        return this.databaseConnection
            .select({
                id: organisationMembershipTable.id,
                role: organisationMembershipTable.role,
                user: {
                    id: userTable.id,
                    displayName: userTable.displayName,
                },
            })
            .from(organisationMembershipTable)
            .innerJoin(
                userTable,
                eq(organisationMembershipTable.userId, userTable.id)
            )
            .where(eq(organisationMembershipTable.organisationId, id))
            .orderBy(userTable.displayName);
    }

    public async getOrganisationMembershipRoleForUserById(
        organisationId: OrganisationId,
        userId: string
    ) {
        return (
            this.onlySingle(
                await this.databaseConnection
                    .select()
                    .from(organisationMembershipTable)
                    .where(
                        and(
                            eq(
                                organisationMembershipTable.organisationId,
                                organisationId
                            ),
                            eq(organisationMembershipTable.userId, userId)
                        )
                    )
            )?.role ?? null
        );
    }

    public async isMemberOfOrganisationById(
        organisationId: OrganisationId,
        userId: string
    ) {
        return (
            (await this.databaseConnection.$count(
                organisationMembershipTable,
                and(
                    eq(
                        organisationMembershipTable.organisationId,
                        organisationId
                    ),
                    eq(organisationMembershipTable.userId, userId)
                )
            )) > 0
        );
    }

    public async isMemberWithRoleOfOrganisationById(
        organisationId: OrganisationId,
        userId: string,
        allowedRoles: OrganisationMembershipRole[]
    ) {
        return (
            (await this.databaseConnection.$count(
                organisationMembershipTable,
                and(
                    eq(
                        organisationMembershipTable.organisationId,
                        organisationId
                    ),
                    eq(organisationMembershipTable.userId, userId),
                    inArray(organisationMembershipTable.role, allowedRoles)
                )
            )) > 0
        );
    }

    public async updateOrganisation(
        id: OrganisationId,
        data: Partial<OrganisationInsert>
    ) {
        return this.onlySingle(
            await this.databaseConnection
                .update(organisationTable)
                .set(data)
                .where(eq(organisationTable.id, id))
                .returning()
        );
    }
}

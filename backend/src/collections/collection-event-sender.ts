import type {
    CollectionEntityId,
    CollectionVersionId,
} from 'fuesim-digital-shared';
import { Marketplace } from 'fuesim-digital-shared';
import type {
    Request as ExpressRequest,
    Response as ExpressResponse,
} from 'express';
import { filter, takeUntil } from 'rxjs';
import { SSE } from '../sse.js';
import type { CollectionService } from '../database/services/collection-service.js';

export class CollectionEventSender {
    private readonly sse: SSE;
    private dependencies: CollectionEntityId[] = [];

    // INFO: strictness is only enforced because all uses should happen after loadLatestCollectionVersion
    private latestCollectionVersion!: CollectionVersionId;

    public get destroy$() {
        return this.sse.destroy$;
    }

    public constructor(
        req: ExpressRequest,
        res: ExpressResponse,
        public readonly collectionEntityId: CollectionEntityId,
        private readonly collectionService: CollectionService,
        private readonly userId: string
    ) {
        this.sse = new SSE(req, res);
        this.init();
    }

    private abort(error: string) {
        console.error(error);
        this.sse.sendEvent('error', { message: error });
        this.sse.close();
    }

    private async init() {
        await this.sendInitialData();
        await this.loadLatestCollectionVersion();
        await this.loadDependencies();
        await this.listen();
    }

    private notifyChange(
        update: typeof Marketplace.Collection.Events.SSEvent.Type
    ) {
        this.sse.sendEvent('change', update);
    }

    private async listen() {
        this.collectionService.events
            .pipe(
                filter(
                    (update) =>
                        update.collectionEntityId === this.collectionEntityId ||
                        this.dependencies.includes(update.collectionEntityId)
                ),
                takeUntil(this.destroy$)
            )
            .subscribe(async (update) => {
                switch (update.event) {
                    case 'dependency:add':
                        await this.loadDependencies();
                        this.notifyChange(update);
                        this.notifyChange(
                            Marketplace.Collection.Events.DependencyReplaceData.schema.encode(
                                {
                                    event: 'dependency:replace-data',
                                    collectionEntityId: this.collectionEntityId,
                                    data:
                                        (
                                            await this.collectionService.getLatestDraftElementsOfCollection(
                                                this.collectionEntityId,
                                                { includeDependencies: true }
                                            )
                                        ).transitive ?? [],
                                }
                            ) as typeof Marketplace.Collection.Events.DependencyReplaceData.Type
                        );
                        break;
                    default:
                        this.notifyChange(update);
                }
            });
    }

    private async loadLatestCollectionVersion() {
        const latestCollection =
            await this.collectionService.getLatestCollectionById(
                this.collectionEntityId,
                { draftState: true }
            );
        if (!latestCollection) {
            this.abort('Collection not found');
            return;
        }
        this.latestCollectionVersion = latestCollection.versionId;
    }

    private async loadDependencies() {
        this.dependencies = (
            await this.collectionService.getCollectionDependencies(
                this.latestCollectionVersion
            )
        ).map((dependency) => dependency.entityId);
    }

    private async sendInitialData() {
        const latestCollection =
            await this.collectionService.getLatestCollectionById(
                this.collectionEntityId,
                { draftState: true }
            );

        if (!latestCollection) {
            this.abort('Collection not found');
            return;
        }

        const data =
            await this.collectionService.getElementsOfCollectionVersion(
                latestCollection.versionId,
                { includeDependencies: true, allowDraftState: true }
            );

        const userRelationship =
            await this.collectionService.getUserRoleInCollection(
                latestCollection.entityId,
                this.userId
            );
        if (!userRelationship) {
            this.abort('User has no relationship to collection');
            return;
        }

        this.notifyChange(
            Marketplace.Collection.Events.InitialData.schema.encode({
                collectionEntityId: this.collectionEntityId,
                event: 'initialdata',
                data: {
                    collection: latestCollection,
                    elements: {
                        transitive: data.transitive ?? [],
                        direct: data.direct,
                    },
                    userRelationship,
                },
            }) as typeof Marketplace.Collection.Events.InitialData.Type
        );
    }
}

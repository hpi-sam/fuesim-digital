import {
    CollectionEntityId,
    CollectionVersionId,
    Marketplace,
} from 'fuesim-digital-shared';
import { Request, Response } from 'express';
import { SSE } from '../sse.js';
import { CollectionService } from '../database/services/collection-service.js';
import { filter, takeUntil } from 'rxjs';

export class CollectionEventSender {
    private readonly sse: SSE;
    private dependencies: CollectionEntityId[] = [];

    //INFO: strictness is only enforced because all uses should happen after loadLatestCollectionVersion
    private latestCollectionVersion!: CollectionVersionId;

    public get destroy$() {
        return this.sse.destroy$;
    }

    constructor(
        req: Request,
        res: Response,
        public readonly collectionEntityId: CollectionEntityId,
        private readonly collectionService: CollectionService
    ) {
        console.log(
            'Initializing CollectionEventSender for collectionEntityId:',
            collectionEntityId
        );
        this.sse = new SSE(req, res);
        console.log('SSE initialized, starting event sender...');
        this.init();
    }

    private abort(error: string) {
        console.error(error);
        this.sse.sendEvent('error', { message: error ?? 'An error occurred' });
        this.sse.close();
        return;
    }

    private async init() {
        await this.sendInitialData();
        await this.loadLatestCollectionVersion();
        await this.loadDependencies();
        await this.listen();
    }

    private notifyChange(update: typeof Marketplace.Set.Events.Event.Type) {
        this.sse.sendEvent('change', update);
    }

    private async listen() {
        console.log(
            'Listening for collection updates for collectionEntityId:',
            this.collectionEntityId,
            this.dependencies
        );
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
                if (!update) return;
                console.log('Update received in event sender:', update);
                switch (update.event) {
                    case 'dependency:add':
                        await this.loadDependencies();
                        this.notifyChange(update);
                        this.notifyChange(
                            Marketplace.Set.Events.DependencyReplaceData.schema.encode(
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
                            ) as typeof Marketplace.Set.Events.DependencyReplaceData.Type
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

        if (!data) {
            this.abort('No elements found for collection');
            return;
        }

        console.log(data);

        this.notifyChange(
            Marketplace.Set.Events.InitialData.schema.encode({
                collectionEntityId: this.collectionEntityId,
                event: 'initialdata',
                data: {
                    collection: latestCollection,
                    elements: {
                        transitive: data.transitive ?? [],
                        direct: data.direct,
                    },
                },
            }) as typeof Marketplace.Set.Events.InitialData.Type
        );
    }
}

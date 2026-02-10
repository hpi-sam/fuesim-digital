import { S3Client } from '@aws-sdk/client-s3';
import { Config } from '../config.js';

export class S3Service {
    public constructor(private readonly client: S3Client) {}

    public static async createNewConnection() {
        Config.initialize();
        const client = new S3Client({
            endpoint: Config.s3Endpoint,
            credentials: {
                accessKeyId: Config.s3AccessKeyId,
                secretAccessKey: Config.s3SecretAccessKey,
            },
        });

        return new S3Service(client);
    }
}

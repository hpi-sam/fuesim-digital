import {
    DeleteObjectCommand,
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { Config } from '../config.js';

export class S3Service {
    public constructor(private readonly client: S3Client) {}

    public static async createNewConnection() {
        Config.initialize();
        const client = new S3Client({
            endpoint: Config.s3Endpoint,
            region: Config.s3Region,
            credentials: {
                accessKeyId: Config.s3AccessKeyId,
                secretAccessKey: Config.s3SecretAccessKey,
            },
            forcePathStyle: true,
        });
        console.log(
            `S3 client configured with endpoint ${Config.s3Endpoint}, region ${Config.s3Region} and bucket ${Config.s3Bucket}`
        );

        return new S3Service(client);
    }

    public async uploadFile(key: string, file: Uint8Array) {
        const command = new PutObjectCommand({
            Bucket: Config.s3Bucket,
            Key: key,
            Body: file,
        });
        await this.client.send(command);
    }

    public async getFile(key: string) {
        const command = new GetObjectCommand({
            Bucket: Config.s3Bucket,
            Key: key,
        });
        const response = await this.client.send(command);
        return response.Body;
    }

    public async deleteFile(key: string) {
        const command = new DeleteObjectCommand({
            Bucket: Config.s3Bucket,
            Key: key,
        });
        await this.client.send(command);
    }
}

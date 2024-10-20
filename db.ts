import { Pool } from 'pg';
import { GetSecretValueCommand, GetSecretValueCommandOutput, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

const PASSWORD_TABLE = "public.passwords";

export class DatabaseHelper {
    private pool: Pool | null = null;

    constructor() {}

    private async getDatabaseSecret() {
        const secret_name: string = "prod-db-secrets";
        const client = new SecretsManagerClient({
            region: "us-east-1",
        });
          
        console.log("Attempting to connect");
        try {
            const response: GetSecretValueCommandOutput = await client.send(
                new GetSecretValueCommand({
                  SecretId: secret_name,
                  VersionStage: "AWSCURRENT",
                })
              );

            if (response.SecretString) {
                const secret = JSON.parse(response.SecretString);
                return {
                    host: secret.host,
                    user: secret.username,
                    password: secret.password,
                    database: secret.dbInstanceIdentifier,
                    port: secret.port,
                };
            } else {
              console.log(`No secret response ${response}`);
            }
        } catch (err) {
            console.error('Failed to retrieve database secrets:', err);
            throw new Error('Error retrieving database credentials');
        }
    }

    public async initialize(): Promise<void> {
        if (!this.pool) {
            const dbConfig = await this.getDatabaseSecret();

            this.pool = new Pool({
                host: dbConfig?.host,
                user: dbConfig?.user,
                password: dbConfig?.password,
                database: dbConfig?.database,
                port: dbConfig?.port,
                ssl: {
                    rejectUnauthorized: false,
                },
            });
            console.log('Database pool initialized');
        }
    }

    public async insertPassword(passwordToInsert: string): Promise<boolean> {
        if (!this.pool) {
            throw new Error('Database pool is not initialized. Call initialize() first.');
        }

        const query = `INSERT INTO ${PASSWORD_TABLE} (password) VALUES ($1)`;
        try {
            const result = await this.pool.query(query, [passwordToInsert]);
            console.log(`Insert successful. ${result.rowCount} row(s) affected`);
            return true;
        } catch (err) {
            console.error(`Error inserting data: ${err.stack}`);
            return false;
        }
    }

    public async close() {
        if (this.pool) {
            await this.pool.end();
            console.log('Database connection pool closed');
        }
    }
}

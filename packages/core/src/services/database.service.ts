import { Collection, Db, MongoClient } from 'mongodb';
import { Document, logger } from '../..';

export class DatabaseService {
  private client: MongoClient;
  private db: Db;
  public collection: Collection;

  constructor(dbConnection: string) {
    this.client = new MongoClient(dbConnection);
    this.db = this.client.db('whiskey-db');
    this.collection = this.db.collection('files');
  }

  public async getAllDocuments() {
    logger.info('Fetching all documents from the database...');
    const documents = await this.collection.find().toArray();
    logger.info(`Fetched ${documents.length} documents.`);
    return documents;
  }

  public async getDocument(key: string) {
    logger.info(`Fetching ${key} from the database...`);
    const document = await this.collection.findOne({ key });
    logger.info('Document fetched successfully.');
    return document;
  }

  public async insertDocument(document: Document) {
    logger.info(`Inserting ${document.key} into the database...`);
    await this.collection.insertOne(document);
    logger.info('Document inserted successfully.');
  }

  public async insertManyDocuments(documents: Document[]) {
    logger.info('Inserting multiple documents into the database...');
    await this.collection.insertMany(documents);
    logger.info(`Inserted ${documents.length} documents.`);
  }

  public async deleteDocument(key: string) {
    logger.info(`Deleting ${key} from the database...`);
    await this.collection.deleteOne({ key });
    logger.info('Document deleted successfully.');
  }

  public async upsertDocument(document: Partial<Document>) {
    logger.info(`Upserting ${document.key} into the database...`);
    await this.collection.updateOne({ key: document.key }, { $set: document }, { upsert: true });
    logger.info('Document upserted successfully.');
  }

  public async updateDocument(document: Partial<Document>) {
    logger.info(`Updating ${document.key} in the database...`);
    await this.collection.updateOne({ key: document.key }, { $set: document });
    logger.info('Document updated successfully.');
  }
}

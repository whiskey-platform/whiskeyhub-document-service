/* eslint-disable @typescript-eslint/no-explicit-any */
import { DeleteRequest, DynamoDBClient, PutRequest, WriteRequest } from '@aws-sdk/client-dynamodb';
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';
import { tracer } from '../utils/tracer';
import { logger } from '../utils/logger';
import { chunk } from 'lodash';

type RequestItemsType =
  | Record<
      string,
      (Omit<WriteRequest, 'PutRequest' | 'DeleteRequest'> & {
        PutRequest?: Omit<PutRequest, 'Item'> & {
          Item: Record<string, NativeAttributeValue> | undefined;
        };
        DeleteRequest?: Omit<DeleteRequest, 'Key'> & {
          Key: Record<string, NativeAttributeValue> | undefined;
        };
      })[]
    >
  | undefined;

export class DynamoDBService {
  private dynamoClient: DynamoDBClient;
  private docClient: DynamoDBDocumentClient;
  constructor() {
    this.dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
    this.docClient = DynamoDBDocumentClient.from(this.dynamoClient);
    tracer.captureAWSv3Client(this.dynamoClient);
  }

  async addItemsToTable(items: any[], table: string) {
    logger.info(`Begin saving ${items.length} item(s) to DynamoDB`);
    const groupsOf25 = chunk(items, 25);
    for (const group of groupsOf25) {
      logger.info(`Saving ${group.length} item(s) to DynamoDB`);
      const RequestItems: RequestItemsType = {};
      RequestItems[table] = group.map(val => ({
        PutRequest: {
          Item: val,
        },
      }));
      const dynamoRequest = new BatchWriteCommand({
        RequestItems,
      });
      logger.info('Sending BATCH WRITE request to DynamoDB');
      logger.debug('BATCH WRITE REQUEST', { dynamoRequest });
      const result = await this.docClient.send(dynamoRequest);
      logger.info(`Successfully added ${group.length} item(s) to DynamoDB`);
      logger.debug('BATCH WRITE RESPONSE', { result });
    }
    logger.info(`Successfully added ${items.length} item(s) to DynamoDB`);
  }

  async getItems(
    TableName: string,
    afterTime: string,
    timeKey: string,
    partitionKey: string,
    partitionValue: string
  ): Promise<any[] | undefined> {
    const request = new QueryCommand({
      TableName,
      KeyConditionExpression: `${partitionKey} = :type AND ${timeKey} > :dt`,
      ExpressionAttributeValues: {
        ':type': partitionValue,
        ':dt': afterTime,
      },
    });
    const result = await this.docClient.send(request);
    return result.Items;
  }
}

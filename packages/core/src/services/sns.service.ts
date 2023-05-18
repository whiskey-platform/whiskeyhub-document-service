import { PublishBatchCommand, SNSClient } from '@aws-sdk/client-sns';
import { chunk } from 'lodash';
import { logger } from '../utils/logger';
export interface ISNSService {
  batchEvents: (events: { id: string; payload: any }[], TopicArn: string) => Promise<void>;
}

export class SNSService {
  private snsClient = new SNSClient({ region: process.env.AWS_REGION });
  public async batchEvents(
    events: { id: string; payload: any }[],
    TopicArn: string
  ): Promise<void> {
    for (const group of chunk(events, 10)) {
      const snsReq = new PublishBatchCommand({
        PublishBatchRequestEntries: group.map(val => ({
          Id: val.id,
          Message: JSON.stringify(val.payload),
        })),
        TopicArn,
      });
      await this.snsClient.send(snsReq);
    }
    logger.info(`Successfully published events to SNS`);
  }
}

import { Function, Script, StackContext, use } from 'sst/constructs';
import { Storage } from './StorageStack';
import { ExternalResources } from './ExternalResources';

export const Housekeeping = ({ stack }: StackContext) => {
  const { bucket, DB_CONNECTION } = use(Storage);
  const { receiptsIngestTopic, receiptsEventsTopic } = use(ExternalResources);

  // Receipts
  new Function(stack, 'SendOldPDFReceiptsForProcessing', {
    handler: 'packages/functions/src/housekeeping/send-old-pdf-receipts-for-processing.handler',
    bind: [bucket, receiptsIngestTopic, DB_CONNECTION],
  });
  new Function(stack, 'DeleteOldPDFReceipts', {
    handler: 'packages/functions/src/housekeeping/delete-old-pdf-receipts.handler',
    bind: [bucket],
  });
  const receiptsEventHandler = new Function(stack, 'ReceiptsEventHandler', {
    handler: 'packages/functions/src/housekeeping/receipts-event-handler.handler',
    bind: [bucket],
    permissions: ['s3'],
  });
  receiptsEventsTopic.addSubscribers(stack, { receiptsEventHandler });

  // General
  new Function(stack, 'DeleteEmptyFiles', {
    handler: 'packages/functions/src/housekeeping/delete-empty-files.handler',
    bind: [bucket],
  });
};

import { Function, StackContext, use } from 'sst/constructs';
import { Storage } from './StorageStack';
import { ExternalResources } from './ExternalResources';

export const Housekeeping = ({ stack }: StackContext) => {
  const { bucket } = use(Storage);
  const { receiptsIngestTopic, receiptsEventsTopic, powertools } = use(ExternalResources);

  // Receipts
  new Function(stack, 'SendOldPDFReceiptsForProcessing', {
    handler: 'packages/functions/src/housekeeping/send-old-pdf-receipts-for-processing.handler',
    bind: [bucket, receiptsIngestTopic],
    layers: [powertools],
  });
  new Function(stack, 'DeleteOldPDFReceipts', {
    handler: 'packages/functions/src/housekeeping/delete-old-pdf-receipts.handler',
    bind: [bucket],
    layers: [powertools],
  });
  const receiptsEventHandler = new Function(stack, 'ReceiptsEventHandler', {
    handler: 'packages/functions/src/housekeeping/receipts-event-handler.handler',
    bind: [bucket],
    layers: [powertools],
  });
  receiptsEventsTopic.addSubscribers(stack, { receiptsEventHandler });

  // General
  new Function(stack, 'DeleteEmptyFiles', {
    handler: 'packages/functions/src/housekeeping/delete-empty-files.handler',
    bind: [bucket],
    layers: [powertools],
  });
};

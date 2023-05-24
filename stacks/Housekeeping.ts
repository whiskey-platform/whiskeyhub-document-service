import { Function, StackContext, use } from 'sst/constructs';
import { Storage } from './StorageStack';
import { ExternalResources } from './ExternalResources';

export const Housekeeping = ({ stack }: StackContext) => {
  const { bucket } = use(Storage);
  const { receiptsIngestTopic, powertools } = use(ExternalResources);

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
};

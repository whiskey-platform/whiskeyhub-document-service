import { Function, StackContext, use } from 'sst/constructs';
import { Storage } from './StorageStack';
import { ExternalResources } from './ExternalResources';

export const Housekeeping = ({ stack }: StackContext) => {
  const { bucket } = use(Storage);
  const { receiptsIngestTopic } = use(ExternalResources);

  new Function(stack, 'SendOldPDFReceiptsForProcessing', {
    handler: 'packages/functions/src/housekeeping/send-old-pdf-receipts-for-processing.handler',
    bind: [bucket, receiptsIngestTopic],
  });
  new Function(stack, 'DeleteOldPDFReceipts', {
    handler: 'packages/functions/src/housekeeping/delete-old-pdf-receipts.handler',
    bind: [bucket],
  });
};

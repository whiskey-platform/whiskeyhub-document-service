import { StackContext, Topic, use } from 'sst/constructs';
import { Storage } from './StorageStack';
import { ExternalResources } from './ExternalResources';

export const TopicStack = ({ stack }: StackContext) => {
  const { bucket } = use(Storage);
  const ingestTopic = new Topic(stack, 'DocumentIngestTopic', {
    subscribers: {
      subscriber: 'packages/functions/src/ingest-topic-subscriber/function.handler',
    },
    defaults: {
      function: {
        bind: [bucket],
        permissions: ['s3'],
      },
    },
  });

  return { ingestTopic };
};

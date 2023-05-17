import { StackContext, Topic, use } from 'sst/constructs';
import { Storage } from './StorageStack';

export const TopicStack = ({ stack }: StackContext) => {
  const { bucket } = use(Storage);
  const ingestTopic = new Topic(stack, 'DocumentIngestTopic', {
    subscribers: {
      subscriber: 'packages/functions/src/ingest-topic-subscriber/function.handler',
    },
  });
  ingestTopic.bind([bucket]);

  return { ingestTopic };
};

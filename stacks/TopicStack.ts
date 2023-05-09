import { StackContext, Topic } from 'sst/constructs';

export const TopicStack = ({ stack }: StackContext) => {
  const ingestTopic = new Topic(stack, 'DocumentIngestTopic', {
    subscribers: {
      subscriber: 'packages/functions/src/ingest-topic-subscriber/function.handler',
    },
  });

  return { ingestTopic };
};

import { Stack, StackContext, Topic } from 'sst/constructs';
import * as sns from 'aws-cdk-lib/aws-sns';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

export const ExternalResources = ({ stack }: StackContext) => {
  const receiptsIngestTopic = new Topic(stack, 'ReceiptsIngestTopic', {
    cdk: {
      topic: sns.Topic.fromTopicArn(
        stack,
        'ExistingReceiptsIngestTopic',
        ssmArn(`/sst/whiskey-receipts-service/${stack.stage}/Topic/Topic/topicArn`, stack)
      ),
    },
  });

  return {
    receiptsIngestTopic,
  };
};

function ssmArn(name: string, stack: Stack): string {
  const arnLookup = StringParameter.valueFromLookup(stack, name);
  let arnLookupValue: string;
  if (arnLookup.includes('dummy-value')) {
    arnLookupValue = stack.formatArn({
      service: 'sns',
      resource: 'topic',
      resourceName: arnLookup,
    });
  } else {
    arnLookupValue = arnLookup;
  }
  return arnLookupValue;
}

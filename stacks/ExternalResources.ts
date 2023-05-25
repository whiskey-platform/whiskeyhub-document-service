import { Stack, StackContext, Topic } from 'sst/constructs';
import * as sns from 'aws-cdk-lib/aws-sns';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { LayerVersion } from 'aws-cdk-lib/aws-lambda';

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

  const receiptsEventsTopic = new Topic(stack, 'ReceiptsEventsTopic', {
    cdk: {
      topic: sns.Topic.fromTopicArn(
        stack,
        'ExistingReceiptsEventsTopic',
        ssmArn(`/sst/whiskey-receipts-service/${stack.stage}/Topic/EventsTopic/topicArn`, stack)
      ),
    },
  });

  const powertools = LayerVersion.fromLayerVersionArn(
    stack,
    'PowertoolsLayer',
    `arn:aws:lambda:${stack.region}:094274105915:layer:AWSLambdaPowertoolsTypeScript:11`
  );

  return {
    receiptsIngestTopic,
    receiptsEventsTopic,
    powertools,
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

import { SSTConfig } from 'sst';
import { API } from './stacks/APIStack';
import { Storage } from './stacks/StorageStack';
import { TopicStack } from './stacks/TopicStack';
import { ExternalResources } from './stacks/ExternalResources';
import { Housekeeping } from './stacks/Housekeeping';

export default {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  config(_input) {
    return {
      name: 'whiskeyhub-document-service',
      region: 'us-east-1',
    };
  },
  stacks(app) {
    app.setDefaultFunctionProps({
      runtime: 'nodejs16.x',
      architecture: 'arm_64',
    });
    app.stack(ExternalResources).stack(Storage).stack(API).stack(TopicStack).stack(Housekeeping);
  },
} satisfies SSTConfig;

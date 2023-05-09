import { Api, StackContext, use } from 'sst/constructs';
import { Storage } from './StorageStack';

export function API({ stack }: StackContext) {
  const { bucket } = use(Storage);
  const api = new Api(stack, 'Api', {
    routes: {
      'GET /files': 'packages/functions/src/list-files/function.handler',
      'POST /files': 'packages/functions/src/upload-file/function.handler',
    },
  });
  api.bind([bucket]);
  stack.addOutputs({
    ApiEndpoint: api.url,
  });
}

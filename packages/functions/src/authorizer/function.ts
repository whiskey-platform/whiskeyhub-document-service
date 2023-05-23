import { APIGatewayRequestAuthorizerHandler, APIGatewayTokenAuthorizerHandler } from 'aws-lambda';
import { logger } from '../lib/logger';
import { AuthService } from '@whiskeyhub-document-service/core';

const auth = AuthService.live();

export const handler: APIGatewayRequestAuthorizerHandler = async event => {
  logger.info('Validating Auth headers');
  logger.debug('Incoming headers', { headers: event.headers });
  try {
    const user = await auth.getUserInfo({
      'Authorization': event.headers!.Authorization!,
      'x-whiskey-client-id': event.headers?['x-whiskey-client-id'] ?? '',
      'x-whiskey-client-secret': event.headers?['x-whiskey-client-secret'] ?? '',
    });

    return {
      principalId: `${user.id}`,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: event.methodArn
          }
        ]
      }
    }
  } catch {
    throw {
      status: 401,
      message: 'Invalid Authorization',
    };
  }
};

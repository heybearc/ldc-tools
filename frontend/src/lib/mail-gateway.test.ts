import assert from 'node:assert/strict';
import test from 'node:test';
import { mailGatewayConfigured, mailGatewayFrom } from './mail-gateway.ts';

test('work mail uses the Cloudigan mailbox and the LDC Admin Team name', () => {
  const previous = {
    url: process.env.MAIL_GATEWAY_URL,
    key: process.env.MAIL_GATEWAY_API_KEY,
    email: process.env.MAIL_GATEWAY_FROM_EMAIL,
    name: process.env.MAIL_GATEWAY_FROM_NAME,
  };
  process.env.MAIL_GATEWAY_URL = 'https://mail.cloudigan.net';
  process.env.MAIL_GATEWAY_API_KEY = 'test-key';
  delete process.env.MAIL_GATEWAY_FROM_EMAIL;
  delete process.env.MAIL_GATEWAY_FROM_NAME;

  assert.equal(mailGatewayConfigured(), true);
  assert.deepEqual(mailGatewayFrom(), {
    fromEmail: 'noreply@cloudigan.com',
    fromName: 'LDC Admin Team',
  });

  process.env.MAIL_GATEWAY_FROM_NAME = 'Region desk';
  assert.equal(mailGatewayFrom().fromName, 'Region desk');

  for (const [name, value] of Object.entries(previous)) {
    const key = name === 'url'
      ? 'MAIL_GATEWAY_URL'
      : name === 'key'
        ? 'MAIL_GATEWAY_API_KEY'
        : name === 'email'
          ? 'MAIL_GATEWAY_FROM_EMAIL'
          : 'MAIL_GATEWAY_FROM_NAME';
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

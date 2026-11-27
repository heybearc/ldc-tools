function gatewayEnv(name: string): string {
  return (process.env[name] || '').trim();
}

export function mailGatewayConfigured(): boolean {
  return Boolean(gatewayEnv('MAIL_GATEWAY_URL') && gatewayEnv('MAIL_GATEWAY_API_KEY'));
}

export function mailGatewayFrom(): { fromEmail: string; fromName: string } {
  return {
    fromEmail: gatewayEnv('MAIL_GATEWAY_FROM_EMAIL') || 'noreply@cloudigan.com',
    fromName: gatewayEnv('MAIL_GATEWAY_FROM_NAME') || 'LDC Admin Team',
  };
}

/** One message per person, so a group alert does not show everyone else's address. */
export async function sendViaMailGateway(input: {
  to: string[];
  subject: string;
  text: string;
  html: string;
  tags?: Record<string, string>;
}): Promise<number> {
  const baseUrl = gatewayEnv('MAIL_GATEWAY_URL').replace(/\/$/, '');
  const apiKey = gatewayEnv('MAIL_GATEWAY_API_KEY');
  const from = mailGatewayFrom();
  let sent = 0;

  for (const recipient of input.to) {
    const response = await fetch(`${baseUrl}/v1/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: recipient,
        subject: input.subject,
        html: input.html,
        text: input.text,
        fromName: from.fromName,
        fromEmail: from.fromEmail,
        ...(input.tags ? { tags: input.tags } : {}),
      }),
    });
    const body = await response.json().catch(() => ({})) as { success?: boolean };
    if (!response.ok || body.success === false) {
      console.error('Mail gateway rejected a work message', response.status);
      continue;
    }
    sent += 1;
  }

  if (sent === 0 && input.to.length > 0) {
    throw new Error('Mail gateway did not accept the work message');
  }
  return sent;
}

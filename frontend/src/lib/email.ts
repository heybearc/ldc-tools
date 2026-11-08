import nodemailer from 'nodemailer';
import { prisma } from './prisma';
import { decryptPassword } from './email-crypto';
import { isDeliverableEmail } from './reachable-email';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const emailConfig = await prisma.emailConfiguration.findFirst({
      where: { isActive: true }
    });

    if (!emailConfig) {
      console.log('No email configuration found, skipping notification');
      return false;
    }

    const transportConfig: any = {
      host: emailConfig.smtpHost,
      port: emailConfig.smtpPort,
      secure: emailConfig.encryption === 'ssl',
      auth: {
        user: emailConfig.username,
        pass: decryptPassword(emailConfig.appPasswordEncrypted || '')
      }
    };

    const transporter = nodemailer.createTransport(transportConfig);

    const recipients = (Array.isArray(options.to) ? options.to : [options.to]).filter((email) => isDeliverableEmail(email));
    if (recipients.length === 0) {
      return false;
    }

    const mailOptions = {
      from: options.from || `"${emailConfig.fromName}" <${emailConfig.fromEmail}>`,
      to: recipients.join(', '),
      subject: options.subject,
      html: options.html
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export function generateFeedbackStatusChangeEmail(
  feedbackTitle: string,
  oldStatus: string,
  newStatus: string,
  feedbackId: string,
  submitterName: string
): string {
  const statusColors: Record<string, string> = {
    NEW: '#6b7280',
    IN_PROGRESS: '#3b82f6',
    RESOLVED: '#22c55e',
    CLOSED: '#ef4444'
  };

  const statusEmojis: Record<string, string> = {
    NEW: '🆕',
    IN_PROGRESS: '⏳',
    RESOLVED: '✅',
    CLOSED: '🔒'
  };

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: ${statusColors[newStatus] || '#6b7280'}; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">${statusEmojis[newStatus]} Feedback Status Updated</h1>
      </div>
      
      <div style="padding: 30px; background-color: #f9fafb;">
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
          Hello ${submitterName},
        </p>
        
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
          Your feedback item has been updated:
        </p>
        
        <div style="background-color: white; border-left: 4px solid ${statusColors[newStatus] || '#6b7280'}; padding: 15px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #111827;">${feedbackTitle}</h2>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            Status changed from <strong>${oldStatus}</strong> to <strong style="color: ${statusColors[newStatus]};">${newStatus}</strong>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXTAUTH_URL}/help/my-feedback" 
             style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
            View Your Feedback
          </a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          Thank you for helping us improve LDC Tools!
        </p>
      </div>
      
      <div style="background-color: #111827; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">LDC Tools - Construction Group Management</p>
      </div>
    </div>
  `;
}

export function generateFeedbackCommentEmail(
  feedbackTitle: string,
  commentText: string,
  commentAuthor: string,
  feedbackId: string,
  submitterName: string
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">💬 New Comment on Your Feedback</h1>
      </div>
      
      <div style="padding: 30px; background-color: #f9fafb;">
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
          Hello ${submitterName},
        </p>
        
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
          <strong>${commentAuthor}</strong> commented on your feedback:
        </p>
        
        <div style="background-color: white; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #111827;">${feedbackTitle}</h2>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.6;">
            ${commentText.replace(/\n/g, '<br>')}
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXTAUTH_URL}/help/my-feedback" 
             style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
            View Feedback & Reply
          </a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          Thank you for helping us improve LDC Tools!
        </p>
      </div>
      
      <div style="background-color: #111827; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">LDC Tools - Construction Group Management</p>
      </div>
    </div>
  `;
}

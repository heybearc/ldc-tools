import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { decryptPassword } from '@/lib/email-crypto';
import { isDeliverableEmail } from '@/lib/reachable-email';


// POST /api/v1/admin/email/test - Send test email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testEmail, config } = body;

    if (!testEmail) {
      return NextResponse.json(
        { success: false, message: 'Test email address is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      return NextResponse.json(
        { success: false, message: 'Invalid test email format' },
        { status: 400 }
      );
    }

    const savedConfig = await prisma.emailConfiguration.findFirst({
      where: { isActive: true }
    });

    if (!savedConfig && !config?.password) {
      return NextResponse.json(
        { success: false, message: 'No email configuration found. Please configure email settings first.' },
        { status: 404 }
      );
    }

    const typedPassword = typeof config?.password === 'string' ? config.password.replace(/\s+/g, '') : '';
    const password = typedPassword || (savedConfig?.appPasswordEncrypted
      ? decryptPassword(savedConfig.appPasswordEncrypted).replace(/\s+/g, '')
      : '');

    const emailConfig = {
      ...(savedConfig || {}),
      ...(config || {}),
      smtpHost: config?.smtpHost || savedConfig?.smtpHost,
      smtpPort: config?.smtpPort || savedConfig?.smtpPort,
      encryption: config?.encryption || savedConfig?.encryption || 'tls',
      username: config?.username || savedConfig?.username,
      fromEmail: config?.fromEmail || savedConfig?.fromEmail,
      fromName: config?.fromName || savedConfig?.fromName,
      provider: config?.provider || savedConfig?.provider,
      id: savedConfig?.id
    };

    if (!emailConfig.username || !password) {
      return NextResponse.json(
        { success: false, message: 'SMTP username or app password is missing. Save the app password, then test again.' },
        { status: 400 }
      );
    }

    // Create transporter based on configuration
    const transportConfig: any = {
      host: emailConfig.smtpHost,
      port: emailConfig.smtpPort,
      secure: emailConfig.encryption === 'ssl', // true for 465, false for other ports
      auth: {
        user: emailConfig.username,
        pass: password
      }
    };

    // Add TLS configuration for STARTTLS
    if (emailConfig.encryption === 'tls') {
      transportConfig.tls = {
        ciphers: 'SSLv3'
      };
    }

    const transporter = nodemailer.createTransport(transportConfig);

    // Verify connection configuration
    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error('SMTP verification failed:', verifyError);
      return NextResponse.json(
        { success: false, message: 'SMTP configuration verification failed. Please check your settings.' },
        { status: 400 }
      );
    }

    if (!isDeliverableEmail(testEmail)) {
      return NextResponse.json({
        success: true,
        message: `SMTP sign-in worked. Nothing was sent because ${testEmail} cannot receive mail.`,
      });
    }

    // Send test email
    const mailOptions = {
      from: `"${emailConfig.fromName}" <${emailConfig.fromEmail}>`,
      to: testEmail,
      subject: 'LDC Tools - Email Configuration Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Email Configuration Test</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f9fafb;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">✅ Email Configuration Successful!</h2>
            
            <p style="color: #4b5563; line-height: 1.6;">
              This is a test email from your LDC Tools admin panel. 
              If you're receiving this message, your email configuration is working correctly.
            </p>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <h3 style="color: #1f2937; margin-top: 0;">Configuration Details:</h3>
              <ul style="color: #6b7280; line-height: 1.8;">
                <li><strong>Provider:</strong> ${emailConfig.provider}</li>
                <li><strong>SMTP Host:</strong> ${emailConfig.smtpHost}</li>
                <li><strong>Port:</strong> ${emailConfig.smtpPort}</li>
                <li><strong>Encryption:</strong> ${emailConfig.encryption}</li>
                <li><strong>From:</strong> ${emailConfig.fromName} &lt;${emailConfig.fromEmail}&gt;</li>
              </ul>
            </div>
            
            <p style="color: #4b5563; line-height: 1.6;">
              You can now use this configuration to send user invitations and system notifications.
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #9ca3af; font-size: 14px;">
                Sent from LDC Tools Admin Panel<br>
                ${new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      `,
      text: `
        LDC Tools - Email Configuration Test
        
        ✅ Email Configuration Successful!
        
        This is a test email from your LDC Tools admin panel. 
        If you're receiving this message, your email configuration is working correctly.
        
        Configuration Details:
        - Provider: ${emailConfig.provider}
        - SMTP Host: ${emailConfig.smtpHost}
        - Port: ${emailConfig.smtpPort}
        - Encryption: ${emailConfig.encryption}
        - From: ${emailConfig.fromName} <${emailConfig.fromEmail}>
        
        You can now use this configuration to send user invitations and system notifications.
        
        Sent from LDC Tools Admin Panel
        ${new Date().toLocaleString()}
      `
    };

    await transporter.sendMail(mailOptions);

    // Update test status and timestamp if using saved config
    if (!config && emailConfig.id) {
      await prisma.emailConfiguration.update({
        where: { id: emailConfig.id },
        data: { 
          testStatus: 'success',
          lastTested: new Date() 
        }
      });
    }

    // Log successful test email
    console.log(`Test email sent successfully to ${testEmail} using ${emailConfig.provider}`);

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${testEmail}`
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to send test email';
    if (error instanceof Error) {
      if (error.message.includes('Invalid login')) {
        errorMessage = 'Authentication failed. Please check your username and password/app password.';
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Connection refused. Please check your SMTP host and port settings.';
      } else if (error.message.includes('ETIMEDOUT')) {
        errorMessage = 'Connection timeout. Please check your network connection and SMTP settings.';
      } else {
        errorMessage = `Email sending failed: ${error.message}`;
      }
    }

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}

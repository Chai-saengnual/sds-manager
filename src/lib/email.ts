import { Resend } from 'resend';
import { format } from 'date-fns';

let resendInstance: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const resend = getResend();
  if (!resend) {
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }
  try {
    const fromEmail = options.from || process.env.EMAIL_FROM || 'SDS Manager <noreply@example.com>';

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(',') : options.cc) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(',') : options.bcc) : undefined,
    });

    if (error) {
      console.error('Resend email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown email error';
    console.error('Email send failed:', error);
    return { success: false, error };
  }
}

export interface ExpirationReminderData {
  productName: string;
  partNumber?: string;
  followUpDate: Date;
  category?: string;
  daysUntilExpiration: number;
}

export async function sendExpirationReminder(
  to: string,
  reminders: ExpirationReminderData[]
): Promise<EmailResult> {
  if (!reminders || reminders.length === 0) {
    return { success: false, error: 'No reminders to send' };
  }

  const isThai = to.includes('.th') || to.includes('@thai');

  const subject = isThai
    ? `SDS Manager: บันทึกการเรียกดูต้องดำเนินการ (${reminders.length} รายการ)`
    : `SDS Manager: ${reminders.length} Record(s) Require Attention`;

  const reminderRows = reminders.map(r => {
    const urgencyColor = r.daysUntilExpiration <= 7 ? '#dc2626' : r.daysUntilExpiration <= 30 ? '#f59e0b' : '#16a34a';
    const urgencyLabel = r.daysUntilExpiration <= 0
      ? (isThai ? 'เกินกำหนดแล้ว' : 'Overdue')
      : r.daysUntilExpiration <= 7
        ? (isThai ? 'เร่งด่วน' : 'Urgent')
        : r.daysUntilExpiration <= 30
          ? (isThai ? 'เร็วๆ นี้' : 'Soon')
          : (isThai ? 'ติดตาม' : 'Follow up');

    return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <strong>${r.productName}</strong>
          ${r.partNumber ? `<br><small style="color: #6b7280;">${r.partNumber}</small>` : ''}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          ${r.category || '-'}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          <span style="background-color: ${urgencyColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
            ${urgencyLabel}
          </span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          ${format(r.followUpDate, 'dd/MM/yyyy')}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          ${r.daysUntilExpiration <= 0
            ? (isThai ? `เกินกำหนด ${Math.abs(r.daysUntilExpiration)} วัน` : `${Math.abs(r.daysUntilExpiration)} days overdue`)
            : r.daysUntilExpiration === 1
              ? (isThai ? '1 วัน' : '1 day')
              : (isThai ? `${r.daysUntilExpiration} วัน` : `${r.daysUntilExpiration} days`)
          }
        </td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; color: #1f2937; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 20px; }
        .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
        .content { background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; }
        .summary { display: flex; justify-content: space-around; margin-bottom: 20px; padding: 16px; background: #f3f4f6; border-radius: 8px; }
        .summary-item { text-align: center; }
        .summary-number { font-size: 24px; font-weight: bold; color: #3b82f6; }
        .summary-label { font-size: 12px; color: #6b7280; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { background: #f9fafb; padding: 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #6b7280; }
        .urgent-count { color: #dc2626; }
        .warning-count { color: #f59e0b; }
        .ok-count { color: #16a34a; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; margin-top: 24px; }
        .cta-button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${isThai ? '📋 บันทึก SDS ต้องดำเนินการ' : '📋 SDS Records Require Action'}</h1>
          <p>${isThai ? 'รายงานจาก SDS Manager' : 'Automated report from SDS Manager'}</p>
        </div>
        <div class="content">
          <div class="summary">
            <div class="summary-item">
              <div class="summary-number urgent-count">${reminders.filter(r => r.daysUntilExpiration <= 7).length}</div>
              <div class="summary-label">${isThai ? 'เร่งด่วน' : 'Urgent'}</div>
            </div>
            <div class="summary-item">
              <div class="summary-number warning-count">${reminders.filter(r => r.daysUntilExpiration > 7 && r.daysUntilExpiration <= 30).length}</div>
              <div class="summary-label">${isThai ? 'เร็วๆ นี้' : 'Soon'}</div>
            </div>
            <div class="summary-item">
              <div class="summary-number ok-count">${reminders.filter(r => r.daysUntilExpiration > 30).length}</div>
              <div class="summary-label">${isThai ? 'ติดตาม' : 'Follow up'}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>${isThai ? 'ผลิตภัณฑ์' : 'Product'}</th>
                <th>${isThai ? 'หมวดหมู่' : 'Category'}</th>
                <th style="text-align: center;">${isThai ? 'สถานะ' : 'Status'}</th>
                <th style="text-align: right;">${isThai ? 'วันที่' : 'Date'}</th>
                <th style="text-align: right;">${isThai ? 'เวลา' : 'Time'}</th>
              </tr>
            </thead>
            <tbody>
              ${reminderRows}
            </tbody>
          </table>

          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || '#'}/dashboard" class="cta-button">
              ${isThai ? 'เปิด SDS Manager' : 'Open SDS Manager'}
            </a>
          </div>
        </div>
        <div class="footer">
          <p>${isThai ? 'อีเมลนี้ถูกส่งโดยระบบอัตโนมัติ' : 'This email was sent automatically by SDS Manager'}</p>
          <p>${format(new Date(), 'PPP p')}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject,
    html,
    text: reminders.map(r =>
      `${r.productName}${r.partNumber ? ` (${r.partNumber})` : ''} - ${isThai ? 'วันที่' : 'Date'}: ${format(r.followUpDate, 'dd/MM/yyyy')}`
    ).join('\n'),
  });
}

export async function sendBulkExpirationReminders(
  recipients: Array<{ email: string; reminders: ExpirationReminderData[] }>
): Promise<Array<{ email: string; result: EmailResult }>> {
  const results = await Promise.all(
    recipients.map(async ({ email, reminders }) => ({
      email,
      result: await sendExpirationReminder(email, reminders),
    }))
  );

  return results;
}

export async function sendNotificationEmail(
  to: string,
  title: string,
  message: string,
  options?: {
    actionUrl?: string;
    actionLabel?: string;
    severity?: 'info' | 'warning' | 'error';
  }
): Promise<EmailResult> {
  const isThai = to.includes('.th') || to.includes('@thai');
  const severityColors = {
    info: '#3b82f6',
    warning: '#f59e0b',
    error: '#dc2626',
  };
  const severity = options?.severity || 'info';
  const color = severityColors[severity];

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; color: #1f2937; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${color}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; }
        .message { padding: 16px; background: #f3f4f6; border-radius: 8px; margin: 16px 0; }
        .footer { text-align: center; padding: 16px; color: #6b7280; font-size: 12px; }
        .cta-button { display: inline-block; background: ${color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 18px;">📢 ${title}</h1>
        </div>
        <div class="content">
          <div class="message">${message}</div>
          ${options?.actionUrl ? `
            <div style="text-align: center;">
              <a href="${options.actionUrl}" class="cta-button">${options.actionLabel || (isThai ? 'ดูรายละเอียด' : 'View Details')}</a>
            </div>
          ` : ''}
        </div>
        <div class="footer">
          <p>${isThai ? 'อีเมลนี้ถูกส่งโดยระบบอัตโนมัติจาก SDS Manager' : 'This notification was sent automatically by SDS Manager'}</p>
          <p>${format(new Date(), 'PPP p')}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `[SDS Manager] ${title}`,
    html,
  });
}

export { sendEmail };
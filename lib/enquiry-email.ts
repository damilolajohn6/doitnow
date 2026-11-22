import { createTransport, type SendMailOptions, type Transporter } from 'nodemailer';
import { CONTACT_EMAIL, MAIN_PHONE_DISPLAY, MAIN_PHONE_TEL, WHATSAPP_URL } from './contact';
import type { EnquiryInput } from './enquiries';

let transporter: Transporter | undefined;

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return entities[character];
  });
}

function multiline(value: string) {
  return escapeHtml(value).replace(/\r?\n/g, '<br />');
}

function emailShell(title: string, content: string) {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f7f3eb;color:#252927;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:640px;margin:0 auto;padding:32px 18px;">
      <div style="border:1px solid #dcd6cc;border-radius:18px;overflow:hidden;background:#ffffff;">
        <div style="height:6px;background:#9a6b3f;"></div>
        <div style="padding:30px;">
          <p style="margin:0 0 20px;font-size:12px;font-weight:700;letter-spacing:2px;color:#9a6b3f;">DO IT NOW FURNITURE AND INTERIOR</p>
          <h1 style="margin:0 0 22px;font-size:27px;line-height:1.2;">${title}</h1>
          ${content}
        </div>
      </div>
      <p style="margin:18px 4px 0;font-size:12px;line-height:1.6;color:#646762;">Design. Build. Deliver. · ${MAIN_PHONE_DISPLAY} · ${CONTACT_EMAIL}</p>
    </div>
  </body>
</html>`;
}

function detailRow(label: string, value: string) {
  if (!value) return '';
  return `<tr>
    <td style="padding:9px 0;width:145px;vertical-align:top;font-size:13px;font-weight:700;color:#646762;">${escapeHtml(label)}</td>
    <td style="padding:9px 0;vertical-align:top;font-size:14px;line-height:1.6;">${multiline(value)}</td>
  </tr>`;
}

export function buildAdminNotification(enquiry: EnquiryInput): {
  subject: string;
  text: string;
  html: string;
} {
  const text = [
    'New Do It Now project enquiry',
    `Reference: ${enquiry.reference}`,
    `Name: ${enquiry.name}`,
    `Phone: ${enquiry.phone || 'Not provided'}`,
    `Email: ${enquiry.email || 'Not provided'}`,
    `Location: ${enquiry.location || 'Not provided'}`,
    `Project type: ${enquiry.projectType}`,
    `Preferred design: ${enquiry.design || 'Not specified'}`,
    `Preferred contact: ${enquiry.preferredContact}`,
    '',
    'Project brief:',
    enquiry.message,
  ].join('\n');
  const html = emailShell(
    `New enquiry · ${escapeHtml(enquiry.reference)}`,
    `<table style="width:100%;border-collapse:collapse;">
      ${detailRow('Name', enquiry.name)}
      ${detailRow('Phone', enquiry.phone || 'Not provided')}
      ${detailRow('Email', enquiry.email || 'Not provided')}
      ${detailRow('Location', enquiry.location || 'Not provided')}
      ${detailRow('Project type', enquiry.projectType)}
      ${detailRow('Preferred design', enquiry.design || 'Not specified')}
      ${detailRow('Preferred contact', enquiry.preferredContact)}
    </table>
    <div style="margin-top:22px;padding:18px;border-radius:12px;background:#f7f3eb;">
      <strong style="display:block;margin-bottom:8px;font-size:13px;color:#646762;">PROJECT BRIEF</strong>
      <div style="font-size:14px;line-height:1.7;">${multiline(enquiry.message)}</div>
    </div>`,
  );
  return { subject: `New enquiry ${enquiry.reference} — ${enquiry.projectType}`, text, html };
}

export function buildCustomerAcknowledgement(enquiry: EnquiryInput): {
  subject: string;
  text: string;
  html: string;
} {
  const text = [
    `Hello ${enquiry.name},`,
    '',
    'Thank you for contacting Do It Now Furniture and Interior. Your project enquiry has been received.',
    `Reference: ${enquiry.reference}`,
    `Project type: ${enquiry.projectType}`,
    `Preferred contact: ${enquiry.preferredContact}`,
    '',
    'We will review your brief and contact you using the details you provided.',
    `You can also call or WhatsApp us on ${MAIN_PHONE_DISPLAY}.`,
    '',
    'Design. Build. Deliver.',
  ].join('\n');
  const html = emailShell(
    'We received your project enquiry.',
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Hello ${escapeHtml(enquiry.name)},</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.7;">Thank you for contacting Do It Now. Your brief has been received and saved for review.</p>
    <div style="padding:18px;border-radius:12px;background:#f7f3eb;">
      <span style="display:block;font-size:12px;font-weight:700;color:#646762;">YOUR REFERENCE</span>
      <strong style="display:block;margin-top:6px;font-size:21px;color:#9a6b3f;">${escapeHtml(enquiry.reference)}</strong>
    </div>
    <p style="margin:20px 0;font-size:15px;line-height:1.7;">We will review your project and contact you using your preferred method: <strong>${escapeHtml(enquiry.preferredContact)}</strong>.</p>
    <p style="margin:0;font-size:14px;line-height:1.7;">Need to add something? Call <a style="color:#9a6b3f;font-weight:700;" href="tel:${MAIN_PHONE_TEL}">${MAIN_PHONE_DISPLAY}</a> or <a style="color:#9a6b3f;font-weight:700;" href="${WHATSAPP_URL}">message us on WhatsApp</a>.</p>`,
  );
  return { subject: `Do It Now enquiry received — ${enquiry.reference}`, text, html };
}

function getMailer() {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');
  if (!user || !pass) return null;
  if (!transporter) {
    transporter = createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }
  return transporter;
}

export async function sendEnquiryEmails(enquiry: EnquiryInput) {
  const mailer = getMailer();
  if (!mailer) {
    if (process.env.VERCEL === '1') {
      console.warn('Gmail enquiry notifications were skipped because Gmail is not configured.');
    }
    return;
  }
  const sender = process.env.GMAIL_USER?.trim() as string;
  const recipient = process.env.ENQUIRY_NOTIFICATION_EMAIL?.trim() || sender;
  const from = `Do It Now Furniture and Interior <${sender}>`;
  const messages: Array<{ kind: string; options: SendMailOptions }> = [
    {
      kind: 'admin notification',
      options: {
        ...buildAdminNotification(enquiry),
        from,
        to: recipient,
        replyTo: enquiry.email || undefined,
      },
    },
  ];
  if (enquiry.email && process.env.ENQUIRY_SEND_ACKNOWLEDGEMENT !== 'false') {
    messages.push({
      kind: 'customer acknowledgement',
      options: {
        ...buildCustomerAcknowledgement(enquiry),
        from,
        to: enquiry.email,
      },
    });
  }
  for (const message of messages) {
    try {
      await mailer.sendMail(message.options);
    } catch {
      console.error(`Gmail ${message.kind} failed for enquiry ${enquiry.reference}.`);
    }
  }
}

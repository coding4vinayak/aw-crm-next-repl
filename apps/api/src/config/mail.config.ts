import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  transport: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
  defaults: {
    from: process.env.FROM_EMAIL || 'noreply@awcrm.com',
    fromName: process.env.FROM_NAME || 'AW CRM',
  },
  templates: {
    dir: process.env.MAIL_TEMPLATES_DIR || './templates',
    options: {
      strict: true,
    },
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
  },
}));
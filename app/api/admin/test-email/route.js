import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import sql from '@/lib/db';
import { getConfigs } from '@/lib/data';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function POST(request) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const configRows = await getConfigs(sql);
    const config = {};
    for (const r of configRows) {
      if (r.key && r.value !== undefined && r.value !== null) {
        config[r.key] = r.value;
      }
    }

    const { 
      smtp_host, 
      smtp_port, 
      smtp_user, 
      smtp_pass, 
      smtp_from_email, 
      admin_notification_email,
      site_title
    } = config;

    if (!smtp_host?.trim() || !smtp_user?.trim() || !smtp_pass?.trim()) {
      return NextResponse.json({ 
        success: false, 
        message: 'SMTP credentials missing. Please fill SMTP Host, User and Password in Email Setup.' 
      }, { status: 400 });
    }

    const adminEmails = (admin_notification_email || smtp_user)
      .split(',')
      .map(e => e.trim())
      .filter(e => e && e.includes('@'));

    if (adminEmails.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Please provide at least one valid Admin Notification Email address.' 
      }, { status: 400 });
    }

    const host = smtp_host.trim();
    const user = smtp_user.trim();
    let pass = smtp_pass.trim();
    if (host.includes('gmail.com')) {
      pass = pass.replace(/\s+/g, '');
    }

    const port = parseInt(smtp_port) || (host.includes('gmail.com') ? 465 : 587);
    const isSecure = port === 465;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: isSecure,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 15000,
      greetingTimeout: 10000,
    });

    const siteTitle = site_title || "THE NAWAB SAHAB";
    let fromAddress;
    if (smtp_from_email && smtp_from_email.trim()) {
      const cleanFrom = smtp_from_email.trim();
      if (!cleanFrom.includes('@')) {
        fromAddress = `"${cleanFrom.replace(/"/g, '')}" <${user}>`;
      } else if (!cleanFrom.includes('<') && cleanFrom.includes('@')) {
        fromAddress = `"${siteTitle}" <${cleanFrom}>`;
      } else {
        fromAddress = cleanFrom;
      }
    } else {
      fromAddress = `"${siteTitle}" <${user}>`;
    }

    const info = await transporter.sendMail({
      from: fromAddress,
      to: adminEmails,
      subject: `🧪 Test Email from ${siteTitle}`,
      html: `
        <div style="background-color: #14141c; border: 1px solid #f59e0b; border-radius: 12px; padding: 24px; color: #ffffff; font-family: sans-serif; max-width: 500px; margin: auto;">
          <h2 style="color: #4ade80; margin-top: 0;">🎉 SMTP Configuration Working!</h2>
          <p style="color: #d1d5db; font-size: 14px;">Your email configuration in <strong>${siteTitle}</strong> is active and working properly.</p>
          <ul style="color: #9ca3af; font-size: 13px; line-height: 1.6;">
            <li><strong>SMTP Server:</strong> ${host} (Port: ${port})</li>
            <li><strong>Sender:</strong> ${fromAddress}</li>
            <li><strong>Recipient(s):</strong> ${adminEmails.join(', ')}</li>
          </ul>
          <p style="color: #6b7280; font-size: 11px; margin-bottom: 0;">Sent via Admin Test Tool.</p>
        </div>
      `
    });

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${adminEmails.join(', ')}!`,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to send test email'
    }, { status: 500 });
  }
}

import nodemailer from 'nodemailer';
import sql from '@/lib/db';
import { getConfigs, DEFAULT_CONFIG } from '@/lib/data';
import { formatPrice, formatWeightDisplay } from '@/lib/functions';

/**
 * Sends order confirmation emails to customer and admin.
 * @param {Object} orderDetails - Order information
 */
export async function sendOrderEmails(orderDetails) {
  try {
    const configRows = await getConfigs(sql);
    const config = { ...DEFAULT_CONFIG };
    for (const r of configRows) {
      if (r.key && r.value !== undefined && r.value !== null) {
        config[r.key] = r.value;
      }
    }

    const { smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from_email, admin_notification_email } = config;

    // Check if SMTP is configured
    if (!smtp_host || !smtp_user || !smtp_pass) {
      console.warn("SMTP credentials not fully configured in admin config. Skipping email dispatch.");
      return { success: false, message: "SMTP not configured" };
    }

    const port = parseInt(smtp_port) || 587;
    const isSecure = port === 465;

    const transporter = nodemailer.createTransport({
      host: smtp_host,
      port: port,
      secure: isSecure,
      auth: {
        user: smtp_user,
        pass: smtp_pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const { order_id, amount, customer, items, payment_method } = orderDetails;
    const siteTitle = config.site_title || "THE NAWAB SAHAB";
    const deliveryTime = config.delivery_time || "25-35 mins";
    const fromAddress = smtp_from_email || `"${siteTitle}" <${smtp_user}>`;

    const itemsHtml = items.map(item => {
      const isWeight = item.pricing_type === "weight";
      const weightText = isWeight ? formatWeightDisplay(item.quantity, item.step_grams, item.unit_label) : "";
      const subtitle = isWeight
        ? `${weightText} ${item.variant_note ? `(${item.variant_note})` : ""}`
        : item.variant_name
        ? `${item.variant_name} ${item.variant_note ? `(${item.variant_note})` : ""}`
        : "";
      const variantDisplay = subtitle ? `<br/><span style="font-size: 11px; color: #f59e0b; font-weight: normal;">${subtitle}</span>` : "";
      const qtyCol = isWeight ? weightText : `x${item.quantity}`;

      return `
      <tr style="border-bottom: 1px solid #2a2a35;">
        <td style="padding: 12px 8px; color: #ffffff; font-weight: bold; font-size: 14px;">${item.name}${variantDisplay}</td>
        <td style="padding: 12px 8px; color: #f59e0b; text-align: center; font-weight: bold; font-size: 14px;">${qtyCol}</td>
        <td style="padding: 12px 8px; color: #22c55e; text-align: right; font-weight: bold; font-size: 14px;">${formatPrice(item.price * item.quantity)}</td>
      </tr>
    `;
    }).join('');

    // 1. Customer Email HTML
    const customerHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin: 0; padding: 0; background-color: #0c0c10; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #ffffff;">
        <div style="max-width: 560px; margin: 20px auto; background-color: #14141c; border: 1px solid #2a2a38; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.8);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #181822, #101016); padding: 30px 24px; text-align: center; border-bottom: 2px solid #f59e0b;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: 2px; text-transform: uppercase;">${siteTitle}</h1>
            <p style="margin: 6px 0 0 0; color: #f59e0b; font-size: 11px; letter-spacing: 3px; font-weight: bold; text-transform: uppercase;">CAFE • BAKERY • SWEETS</p>
          </div>

          <!-- Body -->
          <div style="padding: 28px 24px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="background-color: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.35); color: #4ade80; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Order Confirmed</span>
              <h2 style="margin: 14px 0 4px 0; font-size: 20px; font-weight: 800; color: #ffffff;">Thank You for Your Order!</h2>
              <p style="margin: 0; color: #9ca3af; font-size: 13px;">Hi <strong style="color: #ffffff;">${customer.name}</strong>, our kitchen is preparing your delicious meal.</p>
            </div>

            <!-- Order Meta Pill -->
            <div style="background-color: #1a1a24; border: 1px solid #282836; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px;">
              <table style="width: 100%; font-size: 12px;">
                <tr>
                  <td style="color: #9ca3af;">Order ID:</td>
                  <td style="color: #f59e0b; font-weight: bold; text-align: right;">${order_id}</td>
                </tr>
                <tr>
                  <td style="color: #9ca3af; padding-top: 6px;">Payment Method:</td>
                  <td style="color: #ffffff; font-weight: bold; text-align: right; text-transform: uppercase; padding-top: 6px;">${payment_method === 'cod' ? 'Cash on Delivery (COD)' : 'Paid Online (Razorpay)'}</td>
                </tr>
                <tr>
                  <td style="color: #9ca3af; padding-top: 6px;">Estimated Delivery:</td>
                  <td style="color: #4ade80; font-weight: bold; text-align: right; padding-top: 6px;">⚡ ${deliveryTime}</td>
                </tr>
              </table>
            </div>

            <!-- Items Table -->
            <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin: 0 0 10px 0;">Order Summary</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="border-bottom: 1px solid #333344; color: #6b7280; font-size: 11px; text-transform: uppercase; text-align: left;">
                  <th style="padding-bottom: 8px;">Item</th>
                  <th style="padding-bottom: 8px; text-align: center;">Qty</th>
                  <th style="padding-bottom: 8px; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Total -->
            <div style="background-color: #181820; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px;">
              <table style="width: 100%; font-size: 13px;">
                <tr>
                  <td style="color: #9ca3af;">Delivery Fee:</td>
                  <td style="color: #4ade80; font-weight: bold; text-align: right;">FREE</td>
                </tr>
                <tr>
                  <td style="color: #ffffff; font-weight: bold; font-size: 16px; padding-top: 8px;">Total Amount:</td>
                  <td style="color: #f59e0b; font-weight: 900; font-size: 18px; text-align: right; padding-top: 8px;">${formatPrice(amount)}</td>
                </tr>
              </table>
            </div>

            <!-- Address -->
            <div style="background-color: #1a1a24; border: 1px solid #282836; border-radius: 12px; padding: 14px 18px;">
              <h4 style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; color: #9ca3af; letter-spacing: 1px;">Delivery Address</h4>
              <p style="margin: 0; color: #ffffff; font-size: 13px; line-height: 1.5;">${customer.address}</p>
              <p style="margin: 6px 0 0 0; color: #9ca3af; font-size: 12px;">Contact: <strong style="color: #ffffff;">${customer.phone}</strong></p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #101016; padding: 20px; text-align: center; border-top: 1px solid #222230; font-size: 11px; color: #6b7280;">
            <p style="margin: 0 0 4px 0;">Questions? Reach us anytime via WhatsApp or phone.</p>
            <p style="margin: 0;">© 2026 ${siteTitle} • All Rights Reserved</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // 2. Admin Email HTML
    const adminHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin: 0; padding: 0; background-color: #0c0c10; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #ffffff;">
        <div style="max-width: 560px; margin: 20px auto; background-color: #14141c; border: 1px solid #f59e0b; border-radius: 16px; overflow: hidden;">
          <div style="background-color: #f59e0b; padding: 16px 20px; text-align: center;">
            <h2 style="margin: 0; color: #000000; font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">🚨 New Order Received: ${order_id}</h2>
          </div>
          <div style="padding: 24px;">
            <h3 style="margin: 0 0 12px 0; color: #ffffff; font-size: 15px;">Customer Details:</h3>
            <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #d1d5db; font-size: 13px; line-height: 1.6;">
              <li><strong>Name:</strong> ${customer.name}</li>
              <li><strong>Phone:</strong> ${customer.phone}</li>
              <li><strong>Email:</strong> ${customer.email}</li>
              <li><strong>Address:</strong> ${customer.address}</li>
              ${customer.distance_km ? `<li><strong>Distance:</strong> <span style="color: #60a5fa; font-weight: bold;">~${customer.distance_km} km away</span></li>` : ''}
              ${customer.user_lat && customer.user_lng ? `<li><strong>GPS Location:</strong> <a href="https://www.google.com/maps/search/?api=1&query=${customer.user_lat},${customer.user_lng}" target="_blank" style="color: #f59e0b; text-decoration: underline;">Open in Google Maps (${customer.user_lat.toFixed(4)}, ${customer.user_lng.toFixed(4)})</a></li>` : ''}
              <li><strong>Payment Mode:</strong> <span style="color: #f59e0b; font-weight: bold; text-transform: uppercase;">${payment_method === 'cod' ? 'Cash on Delivery (COD)' : 'Paid Online (Razorpay)'}</span></li>
            </ul>

            <h3 style="margin: 0 0 12px 0; color: #ffffff; font-size: 15px;">Ordered Items:</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
              ${itemsHtml}
            </table>

            <div style="background-color: #1a1a24; padding: 12px 16px; border-radius: 10px; text-align: right;">
              <span style="color: #9ca3af; font-size: 14px;">Total Order Value: </span>
              <strong style="color: #4ade80; font-size: 18px;">${formatPrice(amount)}</strong>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailPromises = [];

    // Send to customer if valid email provided
    if (customer.email && customer.email.includes('@')) {
      emailPromises.push(
        transporter.sendMail({
          from: fromAddress,
          to: customer.email,
          subject: `Order Confirmation #${order_id} - ${siteTitle}`,
          html: customerHtml,
        })
      );
    }

    // Send to admin if admin email configured
    if (admin_notification_email && admin_notification_email.includes('@')) {
      emailPromises.push(
        transporter.sendMail({
          from: fromAddress,
          to: admin_notification_email,
          subject: `🚨 New Order Alert #${order_id} (${formatPrice(amount)}) - ${customer.name}`,
          html: adminHtml,
        })
      );
    }

    const results = await Promise.allSettled(emailPromises);
    console.log("Order email dispatch results:", results);

    return { success: true, results };
  } catch (error) {
    console.error("Failed to send order emails:", error);
    return { success: false, error: error.message };
  }
}

import nodemailer from 'nodemailer';

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (ch) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[ch]));

const json = (statusCode, payload) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  body: JSON.stringify(payload)
});

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Use POST to send an email.' });
  let data;
  try { data = JSON.parse(event.body || '{}'); }
  catch { return json(400, { error: 'The request was not valid JSON.' }); }

  const to = String(data.to || '').trim();
  const subject = String(data.subject || 'Northstar Logistics — Shipment update').trim().slice(0, 180);
  const tracking = String(data.tracking || '').trim().slice(0, 100);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(to)) return json(400, { error: 'Enter a valid recipient email address.' });
  if (!tracking) return json(400, { error: 'A tracking code is required.' });

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    console.error('Gmail configuration missing:', JSON.stringify({ GMAIL_USER: Boolean(user), GMAIL_APP_PASSWORD: Boolean(pass) }));
    return json(500, { error: 'Gmail settings are not available to the deployed Netlify Function. In Netlify Environment variables, ensure GMAIL_USER and GMAIL_APP_PASSWORD are enabled for Functions (not only Builds), then publish a successful deploy.' });
  }

  const fields = [
    ['Sender name', data.senderName], ['Current status', data.status], ['Current location', data.location],
    ['Destination', data.destination], ['Expected delivery', data.expectedDate]
  ];
  if (data.reason) fields.push(['Reason / note', data.reason]);
  const details = fields.map(([label, value]) => `<tr><td style="padding:10px 12px;color:#50627b;border-bottom:1px solid #e5ebf3;width:42%">${escapeHtml(label)}</td><td style="padding:10px 12px;color:#122642;font-weight:600;border-bottom:1px solid #e5ebf3">${escapeHtml(value || 'To be confirmed')}</td></tr>`).join('');
  const siteUrl = String(data.siteUrl || process.env.URL || 'https://snazzy-kringle-c8de52.netlify.app').replace(/\/$/, '');
  const logoUrl = `${siteUrl}/public/northstar-logo.svg`;
  const trackingUrl = String(data.trackingUrl || `${siteUrl}/#home`);
  const copyUrl = `${siteUrl}/copy-tracking.html?code=${encodeURIComponent(tracking)}`;
  const message = String(data.message || '').slice(0, 12000);
  let photoAttachment = null;
  let photoBlock = '';
  const photoData = String(data.photo || '');
  const photoMatch = photoData.match(/^data:image\/(png|jpe?g|webp|gif);base64,([A-Za-z0-9+/=]+)$/i);
  if (photoMatch) {
    const ext = photoMatch[1].toLowerCase().replace('jpeg', 'jpg');
    photoAttachment = { filename: `shipment-picture.${ext}`, content: Buffer.from(photoMatch[2], 'base64'), cid: 'northstar-shipment-photo' };
    photoBlock = `<div style="margin:22px 0;text-align:center;padding:12px;background:#f7f9fc;border:1px solid #e2e8f0;border-radius:12px"><img src="cid:northstar-shipment-photo" alt="Your parcel or luggage" style="display:block;width:auto;max-width:100%;max-height:300px;margin:0 auto;border-radius:9px"><p style="margin:8px 0 0;color:#50627b;font-size:12px">Your shipment picture</p></div>`;
  }
  const airplaneArt = '<div style="margin:0 auto 12px;width:74px;height:38px;color:#dbeafe;font-size:28px">✈</div>';
  const html = `<!doctype html><html><body style="margin:0;padding:24px 10px;background:#f2f5fa;font-family:Arial,Helvetica,sans-serif;color:#172b49"><div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden"><div style="padding:26px 24px;background:#071d39;color:#fff;text-align:center"><img src="${escapeHtml(logoUrl)}" alt="Northstar Logistics" style="max-width:190px;max-height:70px;object-fit:contain">${airplaneArt}<h1 style="font-size:25px;margin:18px 0 6px;color:#fff">Shipment Update</h1><p style="margin:0;color:#d8e6fb">Northstar Logistics • Customer Delivery Notice</p></div><div style="padding:24px"><p style="font-size:16px">Hello ${escapeHtml(data.customerName || 'Customer')},</p><p>Here is the latest information for your shipment.</p><div style="margin:22px 0;padding:20px 12px;text-align:center;border:2px dashed #0b5cff;border-radius:14px;background:#f2f7ff"><div style="font-size:12px;letter-spacing:2px;color:#50627b;font-weight:700">YOUR TRACKING CODE</div><div style="font-size:clamp(25px,6vw,34px);font-weight:800;letter-spacing:1px;color:#092c61;margin:12px 0;overflow-wrap:anywhere">${escapeHtml(tracking)}</div><p style="font-size:12px;color:#50627b;margin:0">Use the button below to open a page where you can copy this code.</p></div><div style="text-align:center;margin:-8px 0 22px"><a href="${escapeHtml(copyUrl)}" style="display:inline-block;background:#ffd43b;color:#10233d;text-decoration:none;font-weight:900;font-size:16px;padding:15px 22px;border-radius:10px;border:2px solid #d69b0b;box-shadow:0 4px 12px #d69b0b55">▣ COPY YOUR TRACKING CODE</a><p style="font-size:11px;color:#50627b;margin:8px 0 0">Opens a page where you can copy the full code.</p></div>${photoBlock}<h2 style="font-size:18px;margin:24px 0 10px">Shipment details</h2><table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px">${details}</table><div style="text-align:center;margin:28px 0"><a href="${escapeHtml(trackingUrl)}" style="display:inline-block;background:#0b5cff;color:#fff;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:9px">Track your shipment</a></div><h2 style="font-size:17px;margin:24px 0 8px">Message from Northstar Logistics</h2><div style="white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.65;font-size:14px;color:#30435e">${escapeHtml(message)}</div><p style="margin-top:26px;line-height:1.6">Kind regards,<br><strong>Northstar Logistics</strong><br>Northstar Logistics shipment service</p></div><div style="padding:16px 24px;background:#f7f9fc;color:#64748b;text-align:center;font-size:12px">Northstar Logistics — FAST and Reliable</div></div></body></html>`;
  const text = `Hello ${data.customerName || 'Customer'},\n\nYour shipment tracking code is: ${tracking}\n\n${fields.map(([label, value]) => `${label}: ${value || 'To be confirmed'}`).join('\n')}\n\n${message}\n\nTrack your shipment: ${trackingUrl}\n\nKind regards,\nNorthstar Logistics`;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass: String(pass).replace(/\s+/g, '') }
    });
    await transporter.sendMail({ from: { name: 'Northstar Logistics', address: user }, to, subject, text, html, ...(photoAttachment ? { attachments: [photoAttachment] } : {}) });
    return json(200, { ok: true, message: 'Email sent successfully.' });
  } catch (error) {
    console.error('Gmail send failed:', error?.message || error);
    return json(502, { error: 'Gmail could not send the email. Check that GMAIL_USER matches the Gmail account used to create the App Password and that the App Password is current.' });
  }
}

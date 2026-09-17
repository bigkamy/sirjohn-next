// The order confirmation email, built from the order itself and the store's own branding.
//
// Email clients only reliably support table layouts and inline styles, so that is what this
// uses. Nothing here is invented: business details that are still unset in site-config stay
// out of the email, and the summary has no tax line because orders don't carry tax.

import { paymentMethodLabels } from "@/lib/checkout";
import { formatDateTime, formatPrice } from "@/lib/format";
import { orderStatusLabel, paymentStatusLabel } from "@/lib/order-status";
import type { OrderDetail } from "@/lib/orders";
import { formatOptions } from "@/lib/product-options";
import { siteConfig } from "@/lib/site-config";
import { siteUrl } from "@/lib/site-url";

const COLORS = {
  page: "#f9f6f2",
  card: "#ffffff",
  border: "#e2e8f0",
  ink: "#0f172a",
  muted: "#64748b",
  brand: siteConfig.brand.primaryColor,
  accent: siteConfig.brand.accentColor,
};

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * An image URL an email client can actually load, or null. Relative paths only work once the
 * site has a public https address, so on localhost images are left out rather than broken.
 */
export function publicImageUrl(src: string | null): string | null {
  if (!src) return null;
  if (/^https:\/\//i.test(src)) return src;
  if (src.startsWith("/") && siteUrl.startsWith("https://")) return `${siteUrl}${src}`;
  return null;
}

/** Where the customer follows their order. Signing in is required, and it shows only their own. */
export function orderUrl(orderNumber: string) {
  return `${siteUrl}/account/orders/${encodeURIComponent(orderNumber)}`;
}

export type BuiltEmail = { subject: string; html: string; text: string };

type Parts = { firstName: string; facts: [string, string][]; summary: [string, string][]; link: string };

export function orderConfirmationEmail(order: OrderDetail): BuiltEmail {
  const address = order.shippingAddress;
  const firstName = address.fullName.split(" ")[0] || "there";
  const link = orderUrl(order.orderNumber);

  const facts: [string, string][] = [
    ["Order number", `#${order.orderNumber}`],
    ["Order date", formatDateTime(order.createdAt)],
    ["Order status", orderStatusLabel(order.status)],
    ["Payment status", paymentStatusLabel(order.paymentStatus)],
    ["Payment method", paymentMethodLabels[order.paymentMethod] ?? order.paymentMethod],
  ];

  // Orders carry no tax of their own, so the summary has no tax line.
  const summary: [string, string][] = [["Subtotal", formatPrice(order.subtotal)]];
  if (order.discount > 0) {
    summary.push([order.couponCode ? `Discount (${order.couponCode})` : "Discount", `-${formatPrice(order.discount)}`]);
  }
  summary.push(["Shipping", order.shipping === 0 ? "Free" : formatPrice(order.shipping)]);

  const parts: Parts = { firstName, facts, summary, link };
  return {
    subject: `Order #${order.orderNumber} confirmed · ${siteConfig.name}`,
    html: buildHtml(order, parts),
    text: buildText(order, parts),
  };
}

function buildHtml(order: OrderDetail, { firstName, facts, summary, link }: Parts) {
  const logo = publicImageUrl(siteConfig.brand.logoSrc);
  const address = order.shippingAddress;

  const header = logo
    ? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(siteConfig.name)}" width="140" style="display:block;max-width:140px;height:auto;border:0;" />`
    : `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
         <td style="background:${COLORS.accent};border-radius:10px;width:40px;height:40px;text-align:center;font:800 15px/40px ${FONT};color:${COLORS.brand};">${escapeHtml(siteConfig.brand.monogram)}</td>
         <td style="padding-left:12px;font:800 15px/1.2 ${FONT};letter-spacing:3px;color:#ffffff;">${escapeHtml(siteConfig.brand.wordmark)}</td>
       </tr></table>`;

  const factRows = facts
    .map(
      ([label, value]) => `<tr>
              <td style="padding:6px 0;font:400 14px/1.5 ${FONT};color:${COLORS.muted};">${escapeHtml(label)}</td>
              <td align="right" style="padding:6px 0;font:600 14px/1.5 ${FONT};color:${COLORS.ink};">${escapeHtml(value)}</td>
            </tr>`,
    )
    .join("");

  const itemRows = order.items
    .map((item) => {
      const image = publicImageUrl(item.image);
      const options = Object.keys(item.options).length > 0 ? formatOptions(item.options) : "";
      return `<tr>
              <td style="padding:16px 0;border-top:1px solid ${COLORS.border};">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
                  ${
                    image
                      ? `<td width="64" valign="top" style="padding-right:14px;">
                    <img src="${escapeHtml(image)}" alt="" width="64" height="64" style="display:block;width:64px;height:64px;border:1px solid ${COLORS.border};border-radius:8px;" />
                  </td>`
                      : ""
                  }
                  <td valign="top" style="font:400 14px/1.5 ${FONT};color:${COLORS.ink};">
                    <strong style="font-weight:600;">${escapeHtml(item.productName)}</strong>
                    ${options ? `<div style="color:${COLORS.muted};font-size:13px;padding-top:2px;">${escapeHtml(options)}</div>` : ""}
                    <div style="color:${COLORS.muted};font-size:13px;padding-top:2px;">Qty ${item.quantity} &times; ${escapeHtml(formatPrice(item.unitPrice))}</div>
                  </td>
                  <td valign="top" align="right" style="font:600 14px/1.5 ${FONT};color:${COLORS.ink};white-space:nowrap;padding-left:12px;">${escapeHtml(formatPrice(item.lineTotal))}</td>
                </tr></table>
              </td>
            </tr>`;
    })
    .join("");

  const summaryRows = summary
    .map(
      ([label, value]) => `<tr>
                  <td style="padding:5px 0;font:400 14px/1.5 ${FONT};color:${COLORS.muted};">${escapeHtml(label)}</td>
                  <td align="right" style="padding:5px 0;font:400 14px/1.5 ${FONT};color:${COLORS.ink};">${escapeHtml(value)}</td>
                </tr>`,
    )
    .join("");

  // Only details the business has actually filled in; the rest stay out of the footer.
  const footerLines = [siteConfig.legalName, siteConfig.contact.address, siteConfig.contact.phone, siteConfig.contact.email].filter(
    (line): line is string => Boolean(line),
  );

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light only" />
<title>Order #${escapeHtml(order.orderNumber)} confirmed</title>
<style>
  @media only screen and (max-width:620px) {
    .wrap { padding:12px !important; }
    .pad { padding-left:20px !important; padding-right:20px !important; }
    .cta { display:block !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${COLORS.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Order #${escapeHtml(order.orderNumber)} &mdash; thank you for your order. Total ${escapeHtml(formatPrice(order.total))}.</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${COLORS.page};">
  <tr>
    <td align="center" class="wrap" style="padding:28px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;background:${COLORS.card};border:1px solid ${COLORS.border};border-radius:16px;">

        <tr>
          <td class="pad" style="background:${COLORS.brand};padding:22px 32px;border-radius:16px 16px 0 0;">${header}</td>
        </tr>

        <tr>
          <td class="pad" style="padding:32px 32px 8px;">
            <h1 style="margin:0;font:700 22px/1.3 ${FONT};color:${COLORS.ink};">Thank you for your order, ${escapeHtml(firstName)}!</h1>
            <p style="margin:12px 0 0;font:400 15px/1.6 ${FONT};color:${COLORS.muted};">We have received your order and it is currently being processed. Here is a summary of what you ordered.</p>
          </td>
        </tr>

        <tr>
          <td class="pad" style="padding:20px 32px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${COLORS.page};border-radius:12px;">
              <tr><td style="padding:14px 18px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${factRows}</table>
              </td></tr>
            </table>
          </td>
        </tr>

        <tr>
          <td class="pad" style="padding:26px 32px 0;">
            <h2 style="margin:0 0 4px;font:600 13px/1.4 ${FONT};letter-spacing:1.5px;text-transform:uppercase;color:${COLORS.muted};">Your items</h2>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${itemRows}</table>
          </td>
        </tr>

        <tr>
          <td class="pad" style="padding:8px 32px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid ${COLORS.border};">
              <tr><td style="padding-top:14px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  ${summaryRows}
                  <tr>
                    <td style="padding:12px 0 0;border-top:1px solid ${COLORS.border};font:700 16px/1.5 ${FONT};color:${COLORS.ink};">Total</td>
                    <td align="right" style="padding:12px 0 0;border-top:1px solid ${COLORS.border};font:700 16px/1.5 ${FONT};color:${COLORS.ink};">${escapeHtml(formatPrice(order.total))}</td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </td>
        </tr>

        <tr>
          <td class="pad" style="padding:26px 32px 0;">
            <h2 style="margin:0 0 8px;font:600 13px/1.4 ${FONT};letter-spacing:1.5px;text-transform:uppercase;color:${COLORS.muted};">Delivery</h2>
            <p style="margin:0;font:400 14px/1.7 ${FONT};color:${COLORS.ink};">
              ${escapeHtml(address.fullName)}<br />
              ${escapeHtml(address.line1)}<br />
              ${escapeHtml(address.city)}, ${escapeHtml(address.state)} ${escapeHtml(address.postalCode)}<br />
              ${escapeHtml(address.country)}
            </p>
            <p style="margin:10px 0 0;font:400 14px/1.6 ${FONT};color:${COLORS.muted};">Shipping method: <span style="color:${COLORS.ink};">${escapeHtml(order.shippingMethod)}</span></p>
          </td>
        </tr>

        <tr>
          <td class="pad" align="center" style="padding:30px 32px 34px;">
            <a class="cta" href="${escapeHtml(link)}" style="display:inline-block;background:${COLORS.brand};color:#ffffff;text-decoration:none;font:600 15px/1 ${FONT};padding:15px 30px;border-radius:999px;">View Your Order</a>
            <p style="margin:14px 0 0;font:400 13px/1.6 ${FONT};color:${COLORS.muted};">You will need to sign in with this email address to view it.</p>
          </td>
        </tr>

        <tr>
          <td class="pad" style="background:${COLORS.page};padding:22px 32px;border-radius:0 0 16px 16px;font:400 12px/1.7 ${FONT};color:${COLORS.muted};">
            <strong style="color:${COLORS.ink};font-weight:600;">${escapeHtml(siteConfig.name)}</strong><br />
            ${footerLines.map((line) => `${escapeHtml(line)}<br />`).join("")}
            You are receiving this email because an order was placed with this address at <a href="${escapeHtml(siteUrl)}" style="color:${COLORS.muted};">${escapeHtml(siteUrl.replace(/^https?:\/\//, ""))}</a>.
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function buildText(order: OrderDetail, { firstName, facts, summary, link }: Parts) {
  const address = order.shippingAddress;
  const lines = [
    siteConfig.name,
    "",
    `Thank you for your order, ${firstName}!`,
    "We have received your order and it is currently being processed.",
    "",
    ...facts.map(([label, value]) => `${label}: ${value}`),
    "",
    "YOUR ITEMS",
    ...order.items.flatMap((item) => [
      `- ${item.productName}`,
      ...(Object.keys(item.options).length > 0 ? [`  ${formatOptions(item.options)}`] : []),
      `  Qty ${item.quantity} x ${formatPrice(item.unitPrice)} = ${formatPrice(item.lineTotal)}`,
    ]),
    "",
    ...summary.map(([label, value]) => `${label}: ${value}`),
    `Total: ${formatPrice(order.total)}`,
    "",
    "DELIVERY",
    address.fullName,
    address.line1,
    `${address.city}, ${address.state} ${address.postalCode}`,
    address.country,
    `Shipping method: ${order.shippingMethod}`,
    "",
    `View your order: ${link}`,
    "You will need to sign in with this email address to view it.",
    "",
    [siteConfig.legalName, siteConfig.contact.address, siteConfig.contact.phone, siteConfig.contact.email].filter(Boolean).join(" · "),
  ];
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

import { siteConfig } from "@/lib/site-config";

// The store's policies, as editable text.
//
// Anything in {{double braces}} is a placeholder for a decision or detail only the business
// can supply. It is highlighted on the page, and the page carries a "draft" notice and is
// kept out of search engines until every placeholder in it has been replaced.
// Statements outside braces describe how this website actually works today.

export const POLICY_SLUGS = ["shipping", "returns", "privacy", "terms"] as const;
export type PolicySlug = (typeof POLICY_SLUGS)[number];

/** Paragraphs are strings; a nested array is a bulleted list. */
export type PolicySection = { heading: string; content: (string | string[])[]; showShippingRates?: boolean };

export type Policy = {
  slug: PolicySlug;
  title: string;
  summary: string;
  /** e.g. "1 April 2027" */
  lastUpdated: string | null;
  sections: PolicySection[];
};

const business = siteConfig.legalName ?? "{{Registered business name}}";
const address = siteConfig.contact.address ?? "{{Registered business address}}";
const email = siteConfig.contact.email ?? "{{Customer support email address}}";
const phone = siteConfig.contact.phone ?? "{{Customer support phone number}}";

const contactSection: PolicySection = {
  heading: "Contact us",
  content: [
    `Questions about this policy can be sent using the form on our Contact page, by email to ${email}, or by phone on ${phone}.`,
    `${business}, ${address}.`,
  ],
};

export const policies: Record<PolicySlug, Policy> = {
  shipping: {
    slug: "shipping",
    title: "Shipping Policy",
    summary: "How orders placed on this website are delivered.",
    lastUpdated: null,
    sections: [
      {
        heading: "Where we deliver",
        content: [
          "Our checkout currently accepts delivery addresses in India, identified by a 6-digit PIN code.",
          "{{Any regions or PIN codes you are unable to deliver to}}",
        ],
      },
      {
        heading: "Delivery options and charges",
        content: [
          "The delivery options available for your order, their estimated delivery times, and their charges are shown at checkout before you place your order. The options currently offered are:",
        ],
        showShippingRates: true,
      },
      {
        heading: "Order processing",
        content: [
          "{{How long it takes to pack and dispatch an order after it is placed, and whether orders are dispatched on weekends and public holidays}}",
        ],
      },
      {
        heading: "Tracking your order",
        content: [
          "When you are signed in, My Orders shows the status of each order: pending, processing, shipped, delivered, or cancelled.",
          "{{Whether you share courier tracking details with customers, and how}}",
        ],
      },
      {
        heading: "Delays and failed deliveries",
        content: [
          "{{What happens if a delivery is delayed, the address is incorrect, or nobody is available to receive the order}}",
        ],
      },
      contactSection,
    ],
  },

  returns: {
    slug: "returns",
    title: "Returns & Refund Policy",
    summary: "How to return an item, cancel an order, and receive a refund.",
    lastUpdated: null,
    sections: [
      {
        heading: "Return window",
        content: ["{{Number of days after delivery within which an item can be returned}}"],
      },
      {
        heading: "Eligible items",
        content: [
          "{{The condition items must be in to be accepted for return, for example unused and in original packaging}}",
          "{{Items that cannot be returned, if any, for example custom-fitted or personalised products}}",
        ],
      },
      {
        heading: "How to request a return",
        content: [
          `Contact us using the form on our Contact page or by email to ${email}, and include your order number. You can find it in My Orders when you are signed in.`,
          "{{Who arranges and pays for the return shipment}}",
        ],
      },
      {
        heading: "Refunds",
        content: [
          "{{How refunds are issued, for example to the original payment method, and how long they take once a return is approved}}",
          "{{Whether delivery charges are refunded}}",
        ],
      },
      {
        heading: "Cancellations",
        content: ["{{Whether and until when customers can cancel an order, and any conditions or charges that apply}}"],
      },
      {
        heading: "Damaged, faulty, or incorrect items",
        content: [
          "{{What customers should do if an item arrives damaged, faulty, or not as ordered, and the time limit for reporting it}}",
        ],
      },
      contactSection,
    ],
  },

  privacy: {
    slug: "privacy",
    title: "Privacy Policy",
    summary: "What personal information this website collects, why, and how you can control it.",
    lastUpdated: null,
    sections: [
      {
        heading: "Who we are",
        content: [`This website is operated by ${business}, ${address}. You can contact us at ${email}.`],
      },
      {
        heading: "Information we collect",
        content: [
          "We collect the information you give us and the information needed to run your account and your orders:",
          [
            "Account details: your name, email address, and, if you choose to add it, your phone number. Passwords are handled by our authentication provider and stored only in hashed form.",
            "Delivery details: the addresses you save to your account and the delivery details you enter at checkout.",
            "Orders: the items and options you order, prices, the delivery method, the payment method you choose, and the order status.",
            "Cart and wishlist: the products you add, so they are still there when you return or sign in on another device.",
            "Messages and sign-ups: what you send through the contact form, and your email address if you subscribe to our newsletter.",
          ],
        ],
      },
      {
        heading: "How we use your information",
        content: [
          [
            "To create and manage your account.",
            "To process, deliver, and support your orders.",
            "To reply to messages you send us.",
            "To send our newsletter, if you subscribed to it.",
          ],
          "{{Any other purposes, such as marketing or analytics}}",
        ],
      },
      {
        heading: "Cookies",
        content: [
          "This website uses only the cookies it needs to work:",
          [
            "Sign-in cookies set by our authentication provider, which keep you logged in.",
            "A cart cookie (sj_cart) that remembers the items in a guest cart for up to 30 days.",
            "A coupon cookie (sj_coupon) that remembers a coupon you have applied, for up to 30 days.",
          ],
          "The website does not currently set advertising or analytics cookies.",
        ],
      },
      {
        heading: "Who we share information with",
        content: [
          "We share information only with the service providers needed to run the store:",
          [
            "Supabase, which hosts our database and customer accounts.",
            "{{Website hosting provider}}",
            "{{Delivery and courier partners}}",
            "{{Payment provider, once online payments are introduced}}",
          ],
          "{{Any other parties, and whether any information is stored or processed outside India}}",
        ],
      },
      {
        heading: "How long we keep information",
        content: ["{{How long account, order, and message information is kept, and why}}"],
      },
      {
        heading: "Your choices and rights",
        content: [
          "When signed in, you can view and update your name and phone number in Profile Settings, and add, edit, or delete your saved addresses in My Addresses.",
          `To ask for a copy of your information, a correction, or the deletion of your account, contact us at ${email}.`,
          "{{How and within what time you respond to such requests}}",
        ],
      },
      {
        heading: "Grievance officer",
        content: ["{{Name and contact details of the person responsible for privacy concerns and grievances}}"],
      },
      {
        heading: "Changes to this policy",
        content: ['When this policy changes, the updated version will be published on this page with a new "last updated" date.'],
      },
    ],
  },

  terms: {
    slug: "terms",
    title: "Terms & Conditions",
    summary: "The terms that apply when you use this website and place orders.",
    lastUpdated: null,
    sections: [
      {
        heading: "About these terms",
        content: [
          `These terms apply to your use of this website, which is operated by ${business}. By creating an account or placing an order, you agree to them.`,
          "{{Business registration details, such as GSTIN, if applicable}}",
        ],
      },
      {
        heading: "Your account",
        content: [
          "You are responsible for keeping your password secure and for activity on your account. Please keep your account details accurate and up to date.",
        ],
      },
      {
        heading: "Products and prices",
        content: [
          "Prices are shown in Indian Rupees (INR). Your order total, including delivery charges and any discount, is calculated when you check out and shown to you before you place your order.",
          "{{Whether prices include GST and other taxes}}",
          "{{What happens if a product is listed with an incorrect price or description}}",
        ],
      },
      {
        heading: "Orders",
        content: [
          "Items are reserved when your order is placed. If an item is no longer available in the quantity you chose, checkout tells you before the order is placed.",
          "{{When an order is considered accepted, and when you may decline or cancel an order}}",
        ],
      },
      {
        heading: "Payment",
        content: ["{{Accepted payment methods and when payment is taken}}"],
      },
      {
        heading: "Coupons",
        content: [
          "Coupon codes are subject to their own conditions, such as a minimum order value, validity dates, and usage limits, which are checked at checkout.",
        ],
      },
      {
        heading: "Delivery, returns, and refunds",
        content: [
          "Delivery is covered by our Shipping Policy. Returns, cancellations, and refunds are covered by our Returns & Refund Policy.",
        ],
      },
      {
        heading: "Intellectual property",
        content: ["{{Who owns the website content, logos, and product images, and how they may be used}}"],
      },
      {
        heading: "Limitation of liability",
        content: ["{{Limits on your liability, as advised by your legal counsel}}"],
      },
      {
        heading: "Governing law",
        content: ["{{The governing law and the courts that have jurisdiction}}"],
      },
      contactSection,
    ],
  },
};

export function getPolicy(slug: string): Policy | undefined {
  return (POLICY_SLUGS as readonly string[]).includes(slug) ? policies[slug as PolicySlug] : undefined;
}

/** Number of {{placeholders}} still in a policy, including its "last updated" date. */
export function countPlaceholders(policy: Policy) {
  const text = JSON.stringify(policy.sections) + (policy.lastUpdated ?? "{{date}}");
  return (text.match(/\{\{/g) ?? []).length;
}

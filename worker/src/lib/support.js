// Customer support: sort each message, decide whether the owner must handle it personally,
// and draft a reply using only our published policies. Never invents order details,
// tracking, dates or refunds; the owner reviews and sends every reply.

const RULES = [
  // [category, escalate, keyword patterns]
  ['dispute', true, /chargeback|dispute|bank (reversed|reversal)|unauthori[sz]ed (charge|payment)|fraud|stolen card|didn'?t (make|authori[sz]e)/i],
  ['legal', true, /lawyer|legal action|sue|court|small claims|lawsuit|consumer protection|report you|better business bureau|\bbbb\b|privacy commissioner/i],
  ['threat', true, /\bkill\b|threat|hurt you|you'?ll regret/i],
  ['privacy', true, /delete my (data|information|account)|what (data|information) do you (have|hold)|access request|pipeda/i],
  ['refund', false, /refund|money back|cancel (my )?order|charged twice|double charged|bought (it )?twice|wrong (tool|product|one)/i],
  ['download', false, /download|link|email|didn'?t (get|receive)|never (got|received)|can'?t (open|find|access)|make a copy|spam/i],
  ['product', false, /formula|province|gst|hst|pst|qst|t2125|tfsa|rrsp|fhsa|invoice|excel|google sheets|how (do|does|to)/i],
];

// A refund request is escalated if it looks like it falls outside the published policy.
function refundOutsidePolicy(message) {
  return /(month|months|year|weeks?) ago|after \d{2,} days|used it (for|all)|didn'?t like/i.test(message);
}

export function classify(message) {
  for (const [category, escalate, re] of RULES) {
    if (re.test(message)) {
      if (category === 'refund' && refundOutsidePolicy(message)) return { category, escalate: true };
      return { category, escalate };
    }
  }
  return { category: 'other', escalate: false };
}

export function draftReply({ category, name, escalate = false }) {
  if (escalate) return null; // the owner writes these personally
  const hi = name ? `Hi ${name.split(/\s+/)[0]},` : 'Hi,';
  const sign = '\n\nThanks,\nLoonie Ledger';
  const drafts = {
    download: `${hi}\n\nSorry the download hasn't reached you. Payhip sends the link by email right after payment, so please check your spam or promotions folder for a message from Payhip first.\n\nIf it isn't there, reply with the email address you used at checkout and the tool's name, and I'll resend it.`,
    refund: `${hi}\n\nThanks for letting us know. Under our refund policy, we refund in full if a file doesn't work and we can't fix it within 7 days, and we refund or swap a duplicate or mistaken purchase made in the last 14 days.\n\nPlease reply with the email address you used at checkout and the tool's name so I can find your order.`,
    product: `${hi}\n\nThanks for your question. [Answer from the file's Start Here tab.]\n\nA reminder that the tools organize your records; they aren't tax advice. For your specific situation, the CRA or an accountant can confirm.`,
    other: `${hi}\n\nThanks for getting in touch. [Reply here.]`,
  };
  if (!drafts[category]) return null; // escalated categories get no template: the owner writes these personally
  return drafts[category] + sign;
}

const EMAIL_RE = /^[^\s@<>()]{1,64}@[^\s@<>()]{1,190}\.[a-z]{2,}$/i;

/** Validate and normalise a contact-form submission. Returns { ok, error?, value? }. */
export function validateContact(input) {
  const name = String(input.name || '').trim().slice(0, 80);
  const email = String(input.email || '').trim().toLowerCase();
  const message = String(input.message || '').trim();
  const orderEmail = String(input.order_email || '').trim().toLowerCase();
  if (input.website) return { ok: false, spam: true };                    // honeypot field
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'Enter a valid email address so we can reply.' };
  if (message.length < 10) return { ok: false, error: 'Tell us a bit more so we can help (at least 10 characters).' };
  if (message.length > 4000) return { ok: false, error: 'Please keep your message under 4,000 characters.' };
  if ((message.match(/https?:\/\//g) || []).length > 3) return { ok: false, spam: true };
  // Strip anything that looks like a card number before storing.
  const cleaned = message.replace(/\b(?:\d[ -]?){13,19}\b/g, '[number removed]');
  return { ok: true, value: { name, email, message: cleaned, orderEmail: EMAIL_RE.test(orderEmail) ? orderEmail : null } };
}

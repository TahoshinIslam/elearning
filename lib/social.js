// Social / chat links from site settings → display-ready list.
// WhatsApp is stored as a phone number and turned into a wa.me link.
export const SOCIAL_KEYS = [
  ['socialFacebook', 'facebook', 'Facebook'],
  ['socialMessenger', 'messenger', 'Messenger'],
  ['socialWhatsapp', 'whatsapp', 'WhatsApp'],
  ['socialYoutube', 'youtube', 'YouTube'],
  ['socialInstagram', 'instagram', 'Instagram'],
  ['socialLinkedin', 'linkedin', 'LinkedIn'],
  ['socialTiktok', 'tiktok', 'TikTok'],
  ['socialTelegram', 'telegram', 'Telegram']
];

export const whatsappUrl = (num, text) => {
  const digits = String(num || '').replace(/[^0-9]/g, '');
  if (!digits) return null;
  const full = digits.startsWith('0') ? `88${digits}` : digits; // Bangladeshi local → +880…
  return `https://wa.me/${full}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};

export function socialLinks(settings = {}) {
  return SOCIAL_KEYS.map(([key, icon, label]) => {
    const raw = String(settings[key] || '').trim();
    if (!raw) return null;
    const href = key === 'socialWhatsapp' ? whatsappUrl(raw) : raw;
    return href ? { key, icon, label, href } : null;
  }).filter(Boolean);
}

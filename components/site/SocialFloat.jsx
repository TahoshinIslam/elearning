import Icon from '@/components/Icon';
import { whatsappUrl } from '@/lib/social';

// Floating chat button (WhatsApp or Messenger), chosen in Admin → Settings →
// Social. Server-rendered; plain link, so it works without JavaScript.
export default function SocialFloat({ settings = {}, lang = 'bn' }) {
  const mode = settings.chatButton || 'off';
  const en = lang === 'en';
  let href = null;
  if (mode === 'whatsapp') href = whatsappUrl(settings.socialWhatsapp, en ? 'Hi! I have a question about a course.' : 'হ্যালো! একটি কোর্স নিয়ে জানতে চাই।');
  if (mode === 'messenger') href = settings.socialMessenger || null;
  if (!href) return null;
  return (
    <a className={`social-float is-${mode}`} href={href} target="_blank" rel="noopener noreferrer"
      aria-label={en ? `Chat with us on ${mode === 'whatsapp' ? 'WhatsApp' : 'Messenger'}` : `${mode === 'whatsapp' ? 'হোয়াটসঅ্যাপে' : 'মেসেঞ্জারে'} কথা বলুন`}>
      <Icon name={mode} size={26} />
      <span className="social-float-label">{en ? 'Chat' : 'চ্যাট'}</span>
    </a>
  );
}

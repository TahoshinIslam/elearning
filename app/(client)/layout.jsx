import PromoPopup from '@/components/home/PromoPopup';
import SocialFloat from '@/components/site/SocialFloat';
import { getLang } from '@/lib/lang';
import { getSettings } from '@/lib/settingsRepo';

// Shared shell for the public site and learner area: the smart campaign
// popup (targeted, triggered, tracked) and the floating WhatsApp / Messenger
// chat button configured in Admin → Settings → Social.
export default async function ClientLayout({ children }) {
  const lang = await getLang();
  const settings = await getSettings().catch(() => ({}));
  return (
    <>
      {children}
      <PromoPopup lang={lang} />
      <SocialFloat settings={settings} lang={lang} />
    </>
  );
}

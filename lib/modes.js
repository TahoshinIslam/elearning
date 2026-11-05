// Course delivery modes, labelled in both languages (editor, filters, cards).
export const MODE_LABEL = {
  bn: { live: 'লাইভ ক্লাস', recorded: 'রেকর্ডেড ক্লাস', hybrid: 'লাইভ + রেকর্ডেড', free: 'ফ্রি কোর্স', workshop: 'ওয়ার্কশপ', webinar: 'ওয়েবিনার' },
  en: { live: 'Live classes', recorded: 'Pre-recorded', hybrid: 'Live + recorded', free: 'Free course', workshop: 'Workshop', webinar: 'Webinar' }
};
export const modeLabel = (lang, mode) => (lang === 'en' ? MODE_LABEL.en : MODE_LABEL.bn)[mode] || mode || '';

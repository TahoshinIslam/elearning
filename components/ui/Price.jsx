import { taka } from '@/lib/copy';

// Shows the price actually charged. A struck-through price appears only
// when a live offer lowers it (listPrice > price) — never a made-up
// "regular" price.
export default function Price({ price, listPrice, lang = 'bn', freeLabel, className = 'price' }) {
  if (!price && !listPrice) return <span className={className}>{freeLabel}</span>;
  const discounted = listPrice != null && listPrice > price;
  return (
    <span className="price-wrap">
      <span className={className}>{price ? taka(lang, price) : freeLabel}</span>
      {discounted && <s className="price-old"><span className="sr-only">{lang === 'en' ? 'Was ' : 'আগের দাম '}</span>{taka(lang, listPrice)}</s>}
    </span>
  );
}

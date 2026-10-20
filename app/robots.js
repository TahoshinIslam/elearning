import { siteUrl } from '@/lib/seo';

export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/learn/', '/student', '/owner', '/superadmin', '/checkout', '/login', '/register', '/forgot', '/reset', '/dev/'] }],
    sitemap: `${siteUrl()}/sitemap.xml`
  };
}

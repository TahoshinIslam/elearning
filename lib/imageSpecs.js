// The one place that says what size each uploaded image should be. The
// same ratios are used by the CSS that displays them (course covers 4:3,
// carousel art 2:1, popup art 16:9), so an image made to spec is never
// cropped.
export const IMAGE_SPECS = {
  courseCard: { w: 1024, h: 768, ratio: '4:3', bn: 'কোর্স কার্ড ও কোর্স পেজের ছবি', en: 'Course card & course page image' },
  slide: { w: 1600, h: 800, ratio: '2:1', bn: 'হোমপেজ ক্যারোসেলের ছবি', en: 'Homepage carousel image' },
  popup: { w: 1280, h: 720, ratio: '16:9', bn: 'পপআপের ছবি', en: 'Popup image' },
  article: { w: 1600, h: 900, ratio: '16:9', bn: 'লেখার কভার ছবি', en: 'Article cover image' }
};
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const IMAGE_MAX_BYTES = 8 * 1024 * 1024;

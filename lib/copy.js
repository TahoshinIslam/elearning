// UI copy for the course-commerce + learning experience (Bangla first,
// English second). Plain data — safe to import from server and client
// components. Older dashboard strings remain in lib/i18n.js.

const bn = {
  skip: 'মূল কনটেন্টে যান',
  brandSub: 'অনলাইন কোর্স',
  navCourses: 'কোর্সসমূহ', navPaths: 'লার্নিং পাথ', navBlog: 'ব্লগ', navAbout: 'আমাদের সম্পর্কে', navContact: 'যোগাযোগ',
  myLearning: 'আমার শেখা', dashboard: 'ড্যাশবোর্ড', login: 'লগইন', signup: 'অ্যাকাউন্ট খুলুন', logout: 'লগআউট',
  orders: 'অর্ডার ও পেমেন্ট', account: 'অ্যাকাউন্ট সেটিংস', cart: 'কার্ট', menu: 'মেনু', close: 'বন্ধ করুন',
  searchPlaceholder: 'কোর্স, বিষয় বা ইন্সট্রাক্টর খুঁজুন', search: 'খুঁজুন', langSwitch: 'English', langSwitchLabel: 'Switch to English',
  signedInAs: 'লগইন করা আছেন',

  footerTagline: 'বাংলায় ভিডিও কোর্স — দেখুন, শিখুন, যেখানে থেমেছিলেন সেখান থেকে আবার শুরু করুন।',
  footLearn: 'শিখুন', footCompany: 'প্রতিষ্ঠান', footPolicies: 'নীতিমালা', footSupport: 'সাপোর্ট',
  terms: 'শর্তাবলী', privacy: 'প্রাইভেসি নীতি', refundPolicy: 'রিফান্ড নীতি', certVerify: 'সার্টিফিকেট যাচাই',
  rights: 'সর্বস্বত্ব সংরক্ষিত।', paymentsBy: 'পেমেন্ট গ্রহণ করা হয় bKash-এর মাধ্যমে',

  heroEyebrow: 'বাংলায় শেখার প্ল্যাটফর্ম',
  heroTitle: 'যে বিষয় শিখতে চান, তার কোর্স এখানেই — নিজের গতিতে।',
  heroSub: 'প্রিভিউ দেখে কোর্স বাছাই করুন, bKash-এ নিরাপদে পেমেন্ট করুন, আর প্রতিটি ডিভাইসে আপনার অগ্রগতি সেভ থাকবে।',
  heroBrowse: 'সব কোর্স দেখুন',
  statCourses: 'প্রকাশিত কোর্স', statLessons: 'লেসন', statLearners: 'সক্রিয় শিক্ষার্থী', statInstructors: 'ইন্সট্রাক্টর',
  featuredTitle: 'জনপ্রিয় কোর্স', featuredSub: 'শিক্ষার্থীরা এখন যেগুলো সবচেয়ে বেশি করছেন।', seeAll: 'সব দেখুন',
  categoriesTitle: 'বিষয় অনুযায়ী খুঁজুন', coursesN: (n) => `${toBn(n)}টি কোর্স`,
  howTitle: 'যেভাবে কাজ করে',
  how1T: 'প্রিভিউ দেখে বাছাই করুন', how1D: 'প্রতিটি কোর্সের পাঠ্যক্রম, ইন্সট্রাক্টর আর ফ্রি প্রিভিউ লেসন কেনার আগেই দেখে নিন।',
  how2T: 'bKash-এ পেমেন্ট', how2D: 'bKash আপনার পেমেন্ট নিশ্চিত করার পরই কোর্সটি আপনার অ্যাকাউন্টে যোগ হয় — সাথে সাথেই।',
  how3T: 'যেখানে থেমেছিলেন সেখান থেকে', how3D: 'ভিডিওর অবস্থান ও লেসনের অগ্রগতি সার্ভারে সেভ থাকে, তাই ফোন বা কম্পিউটার — যেকোনো জায়গা থেকে চালিয়ে যান।',
  instructorsTitle: 'ইন্সট্রাক্টরদের সাথে পরিচিত হোন',
  faqTitle: 'সাধারণ প্রশ্ন',
  faq: [
    ['কীভাবে পেমেন্ট করব?', 'কোর্সের পেজ থেকে “এখনই কিনুন” চাপুন, তারপর bKash-এর নিজস্ব পেমেন্ট পেজে পেমেন্ট সম্পন্ন করুন। ফ্রি কোর্সে কোনো পেমেন্ট লাগে না।'],
    ['কোর্সে কখন ঢুকতে পারব?', 'bKash-এর সার্ভার থেকে পেমেন্ট নিশ্চিত হওয়ার সাথে সাথেই কোর্সটি “আমার শেখা”-তে চলে আসে। নিশ্চিত হতে দেরি হলে অর্ডার পেজ থেকে আবার যাচাই করতে পারবেন।'],
    ['কেনার আগে কিছু দেখা যাবে?', 'হ্যাঁ। যেসব লেসনে “প্রিভিউ” লেখা আছে সেগুলো অ্যাকাউন্ট ছাড়াই দেখা যায়।'],
    ['রিফান্ড পাওয়া যায়?', 'শর্তাবলী অনুযায়ী কোর্স শুরুর ৭ দিনের মধ্যে রিফান্ডের আবেদন করা যায়, শর্তসাপেক্ষে। রিফান্ড হলে ওই কোর্সের অ্যাক্সেস বন্ধ হয়ে যায়।'],
    ['অগ্রগতি কি অন্য ডিভাইসে পাব?', 'হ্যাঁ। একই অ্যাকাউন্টে লগইন করলে যেকোনো ডিভাইসে শেষ দেখা লেসন ও ভিডিওর অবস্থান থেকে শুরু করতে পারবেন।'],
    ['সার্টিফিকেট দেওয়া হয়?', 'প্রতিটি কোর্সের নির্ধারিত অংশ সম্পন্ন করলে “আমার শেখা” থেকে সার্টিফিকেট নিতে পারবেন, যা অনলাইনে যাচাইযোগ্য।']
  ],

  catalogTitle: 'সব কোর্স', catalogSub: 'বিষয়, লেভেল ও দাম অনুযায়ী ফিল্টার করুন।',
  results: (n) => `${toBn(n)}টি কোর্স পাওয়া গেছে`, resultsFor: (n, q) => `“${q}” — ${toBn(n)}টি ফলাফল`,
  filters: 'ফিল্টার', filterCategory: 'বিষয়', filterLevel: 'লেভেল', filterLanguage: 'ভাষা', filterPrice: 'দাম',
  priceAll: 'সব', priceFree: 'ফ্রি', pricePaid: 'পেইড', clearFilters: 'সব ফিল্টার মুছুন', applyFilters: 'ফলাফল দেখুন',
  sortBy: 'সাজান', sort_relevance: 'প্রাসঙ্গিকতা', sort_popular: 'জনপ্রিয়', sort_newest: 'নতুন', sort_rating: 'সর্বোচ্চ রেটিং', 'sort_price-asc': 'দাম: কম থেকে বেশি', 'sort_price-desc': 'দাম: বেশি থেকে কম',
  noResultsT: 'কোনো কোর্স পাওয়া যায়নি', noResultsD: 'অন্য শব্দে খুঁজে দেখুন বা কিছু ফিল্টার সরিয়ে দিন।',
  loadErrorT: 'কোর্সগুলো লোড করা যায়নি', loadErrorD: 'সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।', retry: 'আবার চেষ্টা করুন',
  prev: 'আগের', next: 'পরের', pageOf: (p, n) => `পৃষ্ঠা ${toBn(p)} / ${toBn(n)}`, pagination: 'পৃষ্ঠা নির্বাচন',
  purchasersN: (n) => `${toBn(n)} জন কিনেছেন`, noReviewsYet: 'এখনো রিভিউ নেই', reviewWord: 'রিভিউ',
  badge_featured: 'নির্বাচিত', badge_top_rated: 'সেরা রেটিং', badge_new: 'নতুন', badge_upcoming: 'আসন্ন',
  upcomingT: 'আসন্ন কোর্স', releaseOn: (d) => `প্রকাশ: ${d}`, tba: 'তারিখ পরে জানানো হবে', notifyMe: 'প্রকাশ হলে জানান', notifyEmail: 'আপনার ইমেইল', notifyDone: 'ধন্যবাদ! কোর্সটি প্রকাশ হলে আমরা আপনাকে জানাব।', notifyNote: 'কোর্সটি এখনো প্রকাশিত হয়নি, তাই কেনা যাবে না।',
  offerSave: (p) => `${p} ছাড়`, offerEnds: (d) => `অফার শেষ: ${d}`, listPriceSr: 'আগের দাম ',
  subjectSection: 'বিষয়ভিত্তিক কোর্স', classSection: 'শ্রেণিভিত্তিক কোর্স', featuredSection: 'নির্বাচিত কোর্স', newSection: 'নতুন কোর্স', upcomingSection: 'আসন্ন কোর্স', viewAll: 'সব দেখুন', otherCourses: 'অন্যান্য কোর্স', filterClass: 'শ্রেণি', offerDiscount: 'অফার ছাড়', filterCollection: 'সংগ্রহ', otherCoursesD: 'স্কিল, বিশ্ববিদ্যালয় ও সাধারণ কোর্স', subjectSub: 'যে বিষয় পড়তে চান সেটি বেছে নিন।', classSub: 'আপনার শ্রেণির কোর্স এক জায়গায়।', featuredSectionSub: 'আমাদের বাছাই করা কোর্স।', newSectionSub: 'সম্প্রতি প্রকাশিত কোর্স।', upcomingSectionSub: 'শিগগিরই আসছে — প্রকাশ হলে জানতে “জানান” চাপুন।', prevSlide: 'আগের স্লাইড', nextSlide: 'পরের স্লাইড', pauseSlides: 'স্লাইড থামান', playSlides: 'স্লাইড চালু করুন', slideN: (a, b) => `স্লাইড ${toBn(a)} / ${toBn(b)}`, promotions: 'অফার ও ঘোষণা', closePopup: 'বন্ধ করুন', validUntil: (d) => `মেয়াদ: ${d} পর্যন্ত`, offerExpiredT: 'অফারটির মেয়াদ শেষ হয়েছে', offerExpiredD: 'এখন কোর্সের নিয়মিত দাম প্রযোজ্য।', campaignCourses: 'এই অফারের কোর্স',
  ratingBreakdown: 'রেটিং বিভাজন', yourReview: 'আপনার রিভিউ', editReview: 'রিভিউ সম্পাদনা', reviewPending: 'অনুমোদনের অপেক্ষায়', reviewLive: 'প্রকাশিত', verifiedBuyer: 'যাচাইকৃত ক্রেতা',
  free: 'ফ্রি', owned: 'আপনার কোর্স', lessonsN: (n) => `${toBn(n)}টি লেসন`, studentsN: (n) => `${toBn(n)} জন শিক্ষার্থী`,
  reviewsN: (n) => `${toBn(n)}টি রিভিউ`, noRatingsYet: 'এখনো রেটিং নেই', by: 'ইন্সট্রাক্টর', newBadge: 'নতুন',

  home: 'হোম', previewCourse: 'কোর্সের প্রিভিউ দেখুন', previewN: (n) => `${toBn(n)}টি প্রিভিউ লেসন`,
  whatLearn: 'যা যা শিখবেন', requirements: 'যা জানা থাকা দরকার', audience: 'এই কোর্স কাদের জন্য', description: 'কোর্স সম্পর্কে',
  curriculum: 'পাঠ্যক্রম', sectionsN: (n) => `${toBn(n)}টি সেকশন`, totalLength: 'মোট দৈর্ঘ্য', expandAll: 'সব খুলুন', collapseAll: 'সব বন্ধ করুন',
  preview: 'প্রিভিউ', locked: 'কেনার পর খুলবে', instructor: 'ইন্সট্রাক্টর', reviews: 'শিক্ষার্থীদের রিভিউ', noReviews: 'এই কোর্সে এখনো কোনো যাচাইকৃত রিভিউ নেই।',
  verifiedReviewNote: 'শুধু এই কোর্সে ভর্তি শিক্ষার্থীদের অনুমোদিত রিভিউ দেখানো হয়।',
  courseFaq: 'কোর্স নিয়ে প্রশ্ন', related: 'আরও কোর্স', level: 'লেভেল', language: 'ভাষা', updated: 'সর্বশেষ আপডেট',
  buyNow: 'এখনই কিনুন', enrollFree: 'ফ্রিতে ভর্তি হোন', signInToBuy: 'কিনতে লগইন করুন', addToCart: 'কার্টে যোগ করুন', inCart: 'কার্টে আছে',
  startLearning: 'শেখা শুরু করুন', continueLearning: 'শেখা চালিয়ে যান', youOwn: 'এই কোর্সটি আপনার অ্যাকাউন্টে আছে।',
  pendingT: 'পেমেন্ট যাচাই হচ্ছে', pendingD: 'আপনার bKash পেমেন্টটি এখনো নিশ্চিত হয়নি। যাচাই করুন বা পেমেন্ট সম্পন্ন করুন।', checkPayment: 'পেমেন্ট স্ট্যাটাস দেখুন',
  staffView: 'আপনি স্টাফ হিসেবে লগইন করেছেন — কেনার প্রয়োজন নেই।', openPlayer: 'প্লেয়ারে খুলুন', manageCourse: 'কোর্স এডিট করুন',
  notStudentNote: 'কোর্স কিনতে শিক্ষার্থী অ্যাকাউন্টে লগইন করুন।',
  unavailableT: 'এই কোর্সটি এখন পাওয়া যাচ্ছে না', unavailableD: 'কোর্সটি হয়তো সরিয়ে নেওয়া হয়েছে বা এখনো প্রকাশিত হয়নি।',
  incLessons: (n) => `${toBn(n)}টি লেসন`, incVideo: (d) => `${d} ভিডিও`, incPreview: (n) => `${toBn(n)}টি ফ্রি প্রিভিউ`,
  incDevices: 'মোবাইল ও কম্পিউটারে দেখা যাবে', incProgress: 'অগ্রগতি সব ডিভাইসে সেভ থাকে', incCert: 'সম্পন্ন করলে সার্টিফিকেট',
  accessNote: 'bKash পেমেন্ট নিশ্চিত হওয়ার পরই অ্যাক্সেস দেওয়া হয়।', refundNote: 'কোর্স শুরুর ৭ দিনের মধ্যে রিফান্ডের আবেদন করা যায় (শর্তসাপেক্ষে)।',
  playPreview: 'প্রিভিউ চালান', previewOf: 'প্রিভিউ', closePreview: 'প্রিভিউ বন্ধ করুন', morePreviews: 'অন্যান্য প্রিভিউ',

  checkoutTitle: 'চেকআউট', orderSummary: 'অর্ডারের বিবরণ', subtotal: 'মোট দাম', discount: 'ছাড়', total: 'পরিশোধযোগ্য',
  coupon: 'কুপন কোড', applyCoupon: 'প্রয়োগ করুন', removeCoupon: 'সরান', couponApplied: (c) => `${c} কুপন প্রয়োগ হয়েছে`,
  payWith: 'পেমেন্ট পদ্ধতি', bkashNote: 'আপনাকে bKash-এর নিরাপদ পেমেন্ট পেজে নিয়ে যাওয়া হবে। bKash নিশ্চিত করার পরই কোর্সটি আপনার অ্যাকাউন্টে যোগ হবে।',
  agreeTerms: 'আমি শর্তাবলী ও রিফান্ড নীতি পড়েছি এবং সম্মত।', payBkash: (a) => `bKash-এ ৳${a} পরিশোধ করুন`, confirmFree: 'ফ্রিতে ভর্তি নিশ্চিত করুন',
  redirecting: 'bKash-এ নেওয়া হচ্ছে…', processing: 'প্রক্রিয়া হচ্ছে…', removeItem: 'সরিয়ে দিন', emptyCheckout: 'চেকআউটে কোনো কোর্স নেই।',
  checkoutLoginNote: 'চেকআউট করতে লগইন করুন — এরপর আপনাকে এখানেই ফিরিয়ে আনা হবে।',
  err_already_enrolled: 'এই কোর্সটি ইতিমধ্যে আপনার অ্যাকাউন্টে আছে।', err_payments_unavailable: 'এই মুহূর্তে অনলাইন পেমেন্ট চালু নেই। পরে চেষ্টা করুন বা সাপোর্টে যোগাযোগ করুন।',
  err_gateway_unavailable: 'bKash-এর সাথে সংযোগ করা যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন — কোনো টাকা কাটা হয়নি।', err_course_not_available: 'একটি কোর্স এখন বিক্রির জন্য উপলব্ধ নয়।',
  err_coupon_invalid: 'কুপনটি সঠিক নয়।', err_coupon_expired: 'কুপনের মেয়াদ শেষ।', err_coupon_exhausted: 'কুপনটি আর ব্যবহার করা যাবে না।', err_rate_limited: 'অনেকবার চেষ্টা হয়েছে। একটু পরে আবার চেষ্টা করুন।',
  err_generic: 'কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।', err_network: 'সংযোগ পাওয়া যাচ্ছে না। ইন্টারনেট পরীক্ষা করুন।',

  res_paid_t: 'পেমেন্ট সফল হয়েছে', res_paid_d: 'কোর্সটি এখন আপনার “আমার শেখা”-তে আছে।',
  res_pending_t: 'পেমেন্ট যাচাই করা হচ্ছে', res_pending_d: 'bKash এখনো পেমেন্ট নিশ্চিত করেনি। টাকা কেটে থাকলে কিছুক্ষণের মধ্যেই অ্যাক্সেস পাবেন — নিচে আবার যাচাই করুন।',
  res_failed_t: 'পেমেন্ট সম্পন্ন হয়নি', res_failed_d: 'bKash পেমেন্টটি নিশ্চিত করেনি, তাই কোনো অ্যাক্সেস দেওয়া হয়নি। আবার চেষ্টা করতে পারেন।',
  res_cancelled_t: 'পেমেন্ট বাতিল করা হয়েছে', res_cancelled_d: 'আপনি bKash-এ পেমেন্ট বাতিল করেছেন। চাইলে আবার কিনতে পারেন।',
  res_refunded_t: 'অর্ডারটি রিফান্ড করা হয়েছে', res_refunded_d: 'এই অর্ডারের কোর্স অ্যাক্সেস বন্ধ করা হয়েছে।',
  res_error_t: 'পেমেন্ট যাচাই করা যায়নি', res_error_d: 'অর্ডারের অবস্থা জানতে “অর্ডার ও পেমেন্ট” পেজ দেখুন বা সাপোর্টে যোগাযোগ করুন।',
  checkAgain: 'আবার যাচাই করুন', tryAgain: 'আবার চেষ্টা করুন', goToCourse: 'কোর্সে যান', goMyLearning: 'আমার শেখা', viewOrders: 'সব অর্ডার',
  orderNo: 'অর্ডার নং', paidAt: 'পরিশোধের সময়', trx: 'bKash ট্রানজ্যাকশন', status: 'অবস্থা',
  st_paid: 'পরিশোধিত', st_pending: 'অপেক্ষমাণ', st_failed: 'ব্যর্থ', st_cancelled: 'বাতিল', st_refunded: 'রিফান্ড হয়েছে',

  loginTitle: 'আবার স্বাগতম', loginSub: 'আপনার অ্যাকাউন্টে লগইন করুন।', email: 'ইমেইল', password: 'পাসওয়ার্ড', name: 'পূর্ণ নাম', phone: 'মোবাইল নম্বর (ঐচ্ছিক)',
  loginBtn: 'লগইন করুন', forgot: 'পাসওয়ার্ড ভুলে গেছেন?', noAccount: 'অ্যাকাউন্ট নেই?', haveAccount: 'আগে থেকেই অ্যাকাউন্ট আছে?',
  signupTitle: 'অ্যাকাউন্ট খুলুন', signupSub: 'বিনামূল্যে অ্যাকাউন্ট — কোর্স কিনুন, শিখুন, অগ্রগতি রাখুন।', signupBtn: 'অ্যাকাউন্ট খুলুন', pwHint: 'কমপক্ষে ৮ অক্ষর',
  showPw: 'পাসওয়ার্ড দেখান', hidePw: 'পাসওয়ার্ড লুকান', returnNote: 'লগইনের পর আপনাকে আগের পেজে ফিরিয়ে নেওয়া হবে।',
  err_invalid_credentials: 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।', err_account_disabled: 'এই অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে।', err_email_taken: 'এই ইমেইলে আগেই অ্যাকাউন্ট আছে।',
  err_invalid_email: 'সঠিক ইমেইল দিন।', err_weak_password: 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।', err_name_required: 'নাম লিখুন।', required: 'এই ঘরটি পূরণ করুন।',
  forgotTitle: 'পাসওয়ার্ড রিসেট', forgotSub: 'অ্যাকাউন্টের ইমেইল দিন। অ্যাকাউন্ট থাকলে রিসেট লিংক পাঠানো হবে।', sendLink: 'রিসেট লিংক পাঠান',
  forgotSent: 'অনুরোধটি গ্রহণ করা হয়েছে। এই ইমেইলে অ্যাকাউন্ট থাকলে রিসেট লিংক পাঠানো হবে।', forgotNoEmail: 'দ্রষ্টব্য: ইমেইল পাঠানোর সার্ভিস এখনো চালু হয়নি — সাপোর্টে যোগাযোগ করুন।',
  resetTitle: 'নতুন পাসওয়ার্ড দিন', resetBtn: 'পাসওয়ার্ড সেভ করুন', resetDone: 'পাসওয়ার্ড বদলানো হয়েছে। এখন লগইন করুন।', err_invalid_or_expired_token: 'লিংকটির মেয়াদ শেষ বা সঠিক নয়।',
  demoAccounts: 'ডেভেলপমেন্ট ডেমো অ্যাকাউন্ট',

  backToCourse: 'কোর্স পেজ', progressOf: (a, b) => `${toBn(a)} / ${toBn(b)} সম্পন্ন`, courseContent: 'কোর্সের পাঠসমূহ', searchLessons: 'পাঠ খুঁজুন', lessonsBtn: 'পাঠসমূহ', lessonOf: (a, b) => `পাঠ ${toBn(a)} / ${toBn(b)}`, lessonDetails: 'পাঠের তথ্য', factLesson: 'পাঠ', factSection: 'সেকশন', factType: 'ধরন', factDuration: 'সময়', factStatus: 'অবস্থা', factResources: 'রিসোর্স', notCompleted: 'এখনও সম্পন্ন হয়নি', sectionTime: (m) => `${toBn(m)} মিনিট`,
  prevLesson: 'আগের লেসন', nextLesson: 'পরের লেসন', markComplete: 'সম্পন্ন হিসেবে চিহ্নিত করুন', markIncomplete: 'অসম্পূর্ণ হিসেবে চিহ্নিত করুন', completed: 'সম্পন্ন',
  overview: 'বিবরণ', resources: 'রিসোর্স', qa: 'প্রশ্নোত্তর', noResources: 'এই লেসনে কোনো রিসোর্স নেই।', download: 'ডাউনলোড', openLink: 'লিংক খুলুন',
  hideCurriculum: 'কনটেন্ট তালিকা লুকান', showCurriculum: 'কনটেন্ট তালিকা দেখান',
  videoNotReadyT: 'ভিডিও এখনো আপলোড হয়নি', videoNotReadyD: 'ইন্সট্রাক্টর এই লেসনের ভিডিও যোগ করলেই এখানে দেখা যাবে।',
  playbackErrorT: 'ভিডিও চালানো যাচ্ছে না', playbackErrorD: 'সংযোগে সমস্যা হতে পারে। আবার চেষ্টা করুন — যেখানে ছিলেন সেখান থেকেই চলবে।',
  lockedT: 'এই লেসনটি দেখতে কোর্সটি কিনুন', lockedD: 'কেনার পর সব লেসন খুলে যাবে।',
  loadingVideo: 'ভিডিও লোড হচ্ছে…', saving: 'সেভ হচ্ছে…', saved: 'অগ্রগতি সেভ হয়েছে', saveFailed: 'অগ্রগতি সেভ হয়নি — আবার চেষ্টা করা হচ্ছে',
  watchHint: 'ভিডিওর ৯০% দেখা হলে লেসনটি নিজে থেকেই সম্পন্ন হবে।', readingHint: 'পড়া শেষ হলে নিচের বোতামে চাপ দিন।',
  quizHint: 'কুইজ জমা দিলে লেসনটি সম্পন্ন হবে।', assignmentHint: 'অ্যাসাইনমেন্ট জমা দিলে লেসনটি সম্পন্ন হবে।', openQuiz: 'কুইজ দিন', submitAssignment: 'অ্যাসাইনমেন্ট জমা দিন',
  courseDoneT: 'অভিনন্দন! কোর্সটি সম্পন্ন হয়েছে', courseDoneD: 'সব লেসন শেষ করেছেন। সার্টিফিকেট “আমার শেখা” থেকে নিতে পারবেন।',
  endOfCourseT: 'এটি কোর্সের শেষ লেসন', endOfCourseD: 'বাকি অসম্পূর্ণ লেসনগুলো তালিকা থেকে শেষ করুন।', managerNote: 'স্টাফ রিভিউ মোড — অগ্রগতি সেভ হয় না।',
  speed: 'গতি', captionsLbl: 'সাবটাইটেল',
  type_video: 'ভিডিও', type_pdf: 'পড়া', type_quiz: 'কুইজ', type_assignment: 'অ্যাসাইনমেন্ট',

  mlTitle: 'আমার শেখা', mlSub: 'আপনার কেনা কোর্স ও অগ্রগতি।', tabAll: 'সব', tabInProgress: 'চলমান', tabCompleted: 'সম্পন্ন', tabNotStarted: 'শুরু হয়নি',
  mlEmptyT: 'এখনো কোনো কোর্স নেই', mlEmptyD: 'কোর্স কিনলে বা ফ্রি কোর্সে ভর্তি হলে এখানে দেখা যাবে।', browseCourses: 'কোর্স দেখুন',
  mlEmptyFilter: 'এই তালিকায় কোনো কোর্স নেই।', percentDone: (p) => `${toBn(p)}% সম্পন্ন`, lastViewed: 'সর্বশেষ দেখা', start: 'শুরু করুন', resume: 'চালিয়ে যান',
  noLessonsYet: 'ইন্সট্রাক্টর শিগগিরই লেসন যোগ করবেন।', certificate: 'সার্টিফিকেট', getCertificate: 'সার্টিফিকেট নিন', viewCertificate: 'সার্টিফিকেট দেখুন',
  ordersTitle: 'অর্ডার ও পেমেন্ট', ordersEmpty: 'এখনো কোনো অর্ডার নেই।', date: 'তারিখ', amount: 'পরিমাণ', items: 'কোর্স',
  accountTitle: 'অ্যাকাউন্ট সেটিংস', changePassword: 'পাসওয়ার্ড বদলান', currentPassword: 'বর্তমান পাসওয়ার্ড', newPassword: 'নতুন পাসওয়ার্ড', savePassword: 'পাসওয়ার্ড সেভ করুন',
  passwordChanged: 'পাসওয়ার্ড বদলানো হয়েছে।', err_wrong_password: 'বর্তমান পাসওয়ার্ড সঠিক নয়।', profile: 'প্রোফাইল',
  more: 'আরও', wishlist: 'পছন্দের তালিকা', liveClasses: 'লাইভ ক্লাস', quizzes: 'কুইজ', certificates: 'সার্টিফিকেট', referral: 'রেফারেল', career: 'ক্যারিয়ার'
};

const en = {
  skip: 'Skip to main content',
  brandSub: 'Online courses',
  navCourses: 'Courses', navPaths: 'Learning paths', navBlog: 'Blog', navAbout: 'About', navContact: 'Contact',
  myLearning: 'My learning', dashboard: 'Dashboard', login: 'Log in', signup: 'Sign up', logout: 'Log out',
  orders: 'Orders & payments', account: 'Account settings', cart: 'Cart', menu: 'Menu', close: 'Close',
  searchPlaceholder: 'Search courses, topics or instructors', search: 'Search', langSwitch: 'বাংলা', langSwitchLabel: 'বাংলায় দেখুন',
  signedInAs: 'Signed in as',

  footerTagline: 'Video courses in Bangla — watch, learn, and pick up exactly where you left off.',
  footLearn: 'Learn', footCompany: 'Company', footPolicies: 'Policies', footSupport: 'Support',
  terms: 'Terms', privacy: 'Privacy policy', refundPolicy: 'Refund policy', certVerify: 'Verify a certificate',
  rights: 'All rights reserved.', paymentsBy: 'Payments are processed by bKash',

  heroEyebrow: 'Learn in Bangla',
  heroTitle: 'The course for what you want to learn — at your own pace.',
  heroSub: 'Pick a course after watching its preview, pay securely with bKash, and your progress is saved on every device.',
  heroBrowse: 'Browse all courses',
  statCourses: 'Published courses', statLessons: 'Lessons', statLearners: 'Active learners', statInstructors: 'Instructors',
  featuredTitle: 'Popular courses', featuredSub: 'What learners are taking right now.', seeAll: 'See all',
  categoriesTitle: 'Browse by topic', coursesN: (n) => `${n} course${n === 1 ? '' : 's'}`,
  howTitle: 'How it works',
  how1T: 'Preview before you buy', how1D: 'See every course’s curriculum, instructor and free preview lessons before you pay.',
  how2T: 'Pay with bKash', how2D: 'The course is added to your account the moment bKash confirms your payment.',
  how3T: 'Resume anywhere', how3D: 'Your video position and lesson progress are saved on our servers — continue on phone or computer.',
  instructorsTitle: 'Meet the instructors',
  faqTitle: 'Frequently asked questions',
  faq: [
    ['How do I pay?', 'Choose “Buy now” on a course page, then complete payment on bKash’s own payment page. Free courses need no payment.'],
    ['When do I get access?', 'As soon as bKash’s servers confirm the payment, the course appears in My learning. If confirmation is delayed you can re-check it from your order page.'],
    ['Can I see anything before buying?', 'Yes. Lessons marked “Preview” can be watched without an account.'],
    ['Can I get a refund?', 'Per our terms, refunds may be requested within 7 days of the course start, subject to conditions. A refund removes access to that course.'],
    ['Is my progress available on other devices?', 'Yes. Sign in with the same account on any device to continue from your last lesson and video position.'],
    ['Do you issue certificates?', 'Complete the required share of a course and you can claim a certificate from My learning. Certificates can be verified online.']
  ],

  catalogTitle: 'All courses', catalogSub: 'Filter by topic, level and price.',
  results: (n) => `${n} course${n === 1 ? '' : 's'}`, resultsFor: (n, q) => `${n} result${n === 1 ? '' : 's'} for “${q}”`,
  filters: 'Filters', filterCategory: 'Topic', filterLevel: 'Level', filterLanguage: 'Language', filterPrice: 'Price',
  priceAll: 'All', priceFree: 'Free', pricePaid: 'Paid', clearFilters: 'Clear all filters', applyFilters: 'Show results',
  sortBy: 'Sort by', sort_relevance: 'Relevance', sort_popular: 'Most popular', sort_newest: 'Newest', sort_rating: 'Highest rated', 'sort_price-asc': 'Price: low to high', 'sort_price-desc': 'Price: high to low',
  noResultsT: 'No courses found', noResultsD: 'Try a different search term or remove some filters.',
  loadErrorT: 'Couldn’t load courses', loadErrorD: 'Check your connection and try again.', retry: 'Try again',
  prev: 'Previous', next: 'Next', pageOf: (p, n) => `Page ${p} of ${n}`, pagination: 'Pagination',
  purchasersN: (n) => `${n} purchased`, noReviewsYet: 'No reviews yet', reviewWord: 'Reviews',
  badge_featured: 'Featured', badge_top_rated: 'Top rated', badge_new: 'New', badge_upcoming: 'Upcoming',
  upcomingT: 'Upcoming course', releaseOn: (d) => `Releases ${d}`, tba: 'To be announced', notifyMe: 'Notify me', notifyEmail: 'Your email', notifyDone: 'Thanks! We’ll let you know when this course is released.', notifyNote: 'This course isn’t released yet, so it can’t be purchased.',
  offerSave: (p) => `${p} off`, offerEnds: (d) => `Offer ends ${d}`, listPriceSr: 'Was ',
  subjectSection: 'Browse by subject', classSection: 'Browse by class', featuredSection: 'Featured courses', newSection: 'New arrivals', upcomingSection: 'Upcoming courses', viewAll: 'View all', otherCourses: 'Other courses', filterClass: 'Class', offerDiscount: 'Offer discount', filterCollection: 'Collection', otherCoursesD: 'Skills, university and general courses', subjectSub: 'Pick what you want to study.', classSub: 'Courses for your class, in one place.', featuredSectionSub: 'Hand-picked by our team.', newSectionSub: 'Recently published.', upcomingSectionSub: 'Coming soon — tap “Notify me” to hear when they launch.', prevSlide: 'Previous slide', nextSlide: 'Next slide', pauseSlides: 'Pause slides', playSlides: 'Play slides', slideN: (a, b) => `Slide ${a} of ${b}`, promotions: 'Offers and announcements', closePopup: 'Close', validUntil: (d) => `Valid until ${d}`, offerExpiredT: 'This offer has ended', offerExpiredD: 'The course’s regular price applies now.', campaignCourses: 'Courses in this offer',
  ratingBreakdown: 'Rating breakdown', yourReview: 'Your review', editReview: 'Edit review', reviewPending: 'Awaiting approval', reviewLive: 'Published', verifiedBuyer: 'Verified purchase',
  free: 'Free', owned: 'Enrolled', lessonsN: (n) => `${n} lesson${n === 1 ? '' : 's'}`, studentsN: (n) => `${n} student${n === 1 ? '' : 's'}`,
  reviewsN: (n) => `${n} review${n === 1 ? '' : 's'}`, noRatingsYet: 'No ratings yet', by: 'Instructor', newBadge: 'New',

  home: 'Home', previewCourse: 'Preview this course', previewN: (n) => `${n} preview lesson${n === 1 ? '' : 's'}`,
  whatLearn: 'What you’ll learn', requirements: 'Requirements', audience: 'Who this course is for', description: 'About this course',
  curriculum: 'Curriculum', sectionsN: (n) => `${n} section${n === 1 ? '' : 's'}`, totalLength: 'Total length', expandAll: 'Expand all', collapseAll: 'Collapse all',
  preview: 'Preview', locked: 'Unlocks after purchase', instructor: 'Instructor', reviews: 'Student reviews', noReviews: 'This course has no verified reviews yet.',
  verifiedReviewNote: 'Only approved reviews from students enrolled in this course are shown.',
  courseFaq: 'Course FAQ', related: 'More courses', level: 'Level', language: 'Language', updated: 'Last updated',
  buyNow: 'Buy now', enrollFree: 'Enroll for free', signInToBuy: 'Log in to buy', addToCart: 'Add to cart', inCart: 'In cart',
  startLearning: 'Start learning', continueLearning: 'Continue learning', youOwn: 'This course is in your account.',
  pendingT: 'Payment being verified', pendingD: 'Your bKash payment isn’t confirmed yet. Check its status or finish paying.', checkPayment: 'Check payment status',
  staffView: 'You’re signed in as staff — no purchase needed.', openPlayer: 'Open in player', manageCourse: 'Edit course',
  notStudentNote: 'Log in with a student account to buy courses.',
  unavailableT: 'This course isn’t available', unavailableD: 'It may have been withdrawn or isn’t published yet.',
  incLessons: (n) => `${n} lesson${n === 1 ? '' : 's'}`, incVideo: (d) => `${d} of video`, incPreview: (n) => `${n} free preview${n === 1 ? '' : 's'}`,
  incDevices: 'Watch on mobile and desktop', incProgress: 'Progress saved across devices', incCert: 'Certificate on completion',
  accessNote: 'Access is granted only after bKash confirms the payment.', refundNote: 'Refunds may be requested within 7 days of the course start (conditions apply).',
  playPreview: 'Play preview', previewOf: 'Preview', closePreview: 'Close preview', morePreviews: 'Other previews',

  checkoutTitle: 'Checkout', orderSummary: 'Order summary', subtotal: 'Subtotal', discount: 'Discount', total: 'Total',
  coupon: 'Coupon code', applyCoupon: 'Apply', removeCoupon: 'Remove', couponApplied: (c) => `Coupon ${c} applied`,
  payWith: 'Payment method', bkashNote: 'You’ll be taken to bKash’s secure payment page. The course is added to your account once bKash confirms the payment.',
  agreeTerms: 'I have read and agree to the terms and refund policy.', payBkash: (a) => `Pay ৳${a} with bKash`, confirmFree: 'Confirm free enrollment',
  redirecting: 'Redirecting to bKash…', processing: 'Processing…', removeItem: 'Remove', emptyCheckout: 'There’s nothing to check out.',
  checkoutLoginNote: 'Log in to check out — you’ll be brought straight back here.',
  err_already_enrolled: 'This course is already in your account.', err_payments_unavailable: 'Online payment isn’t available right now. Please try later or contact support.',
  err_gateway_unavailable: 'We couldn’t reach bKash. Please try again shortly — you have not been charged.', err_course_not_available: 'A course in this order isn’t available for purchase.',
  err_coupon_invalid: 'That coupon isn’t valid.', err_coupon_expired: 'That coupon has expired.', err_coupon_exhausted: 'That coupon can’t be used any more.', err_rate_limited: 'Too many attempts. Please wait a moment and try again.',
  err_generic: 'Something went wrong. Please try again.', err_network: 'You appear to be offline. Check your connection.',

  res_paid_t: 'Payment successful', res_paid_d: 'The course is now in My learning.',
  res_pending_t: 'Verifying your payment', res_pending_d: 'bKash hasn’t confirmed the payment yet. If you were charged, access will follow shortly — check again below.',
  res_failed_t: 'Payment not completed', res_failed_d: 'bKash didn’t confirm this payment, so no access was granted. You can try again.',
  res_cancelled_t: 'Payment cancelled', res_cancelled_d: 'You cancelled the payment on bKash. You can buy again any time.',
  res_refunded_t: 'This order was refunded', res_refunded_d: 'Access granted by this order has been removed.',
  res_error_t: 'We couldn’t verify the payment', res_error_d: 'See Orders & payments for the current status, or contact support.',
  checkAgain: 'Check again', tryAgain: 'Try again', goToCourse: 'Go to course', goMyLearning: 'My learning', viewOrders: 'All orders',
  orderNo: 'Order', paidAt: 'Paid at', trx: 'bKash transaction', status: 'Status',
  st_paid: 'Paid', st_pending: 'Pending', st_failed: 'Failed', st_cancelled: 'Cancelled', st_refunded: 'Refunded',

  loginTitle: 'Welcome back', loginSub: 'Log in to your account.', email: 'Email', password: 'Password', name: 'Full name', phone: 'Mobile number (optional)',
  loginBtn: 'Log in', forgot: 'Forgot password?', noAccount: 'No account yet?', haveAccount: 'Already have an account?',
  signupTitle: 'Create your account', signupSub: 'Free account — buy courses, learn, keep your progress.', signupBtn: 'Create account', pwHint: 'At least 8 characters',
  showPw: 'Show password', hidePw: 'Hide password', returnNote: 'You’ll return to where you were after logging in.',
  err_invalid_credentials: 'Email or password is incorrect.', err_account_disabled: 'This account has been disabled.', err_email_taken: 'An account already exists for this email.',
  err_invalid_email: 'Enter a valid email address.', err_weak_password: 'Password must be at least 8 characters.', err_name_required: 'Enter your name.', required: 'This field is required.',
  forgotTitle: 'Reset your password', forgotSub: 'Enter your account email. If an account exists we’ll send a reset link.', sendLink: 'Send reset link',
  forgotSent: 'Request received. If an account exists for this email, a reset link will be sent.', forgotNoEmail: 'Note: email delivery isn’t configured yet — please contact support.',
  resetTitle: 'Choose a new password', resetBtn: 'Save password', resetDone: 'Password updated. You can log in now.', err_invalid_or_expired_token: 'This link is invalid or has expired.',
  demoAccounts: 'Development demo accounts',

  backToCourse: 'Course page', progressOf: (a, b) => `${a} of ${b} complete`, courseContent: 'Course lessons', searchLessons: 'Search lessons', lessonsBtn: 'Lessons', lessonOf: (a, b) => `Lesson ${a} of ${b}`, lessonDetails: 'Lesson details', factLesson: 'Lesson', factSection: 'Section', factType: 'Type', factDuration: 'Duration', factStatus: 'Status', factResources: 'Resources', notCompleted: 'Not completed yet', sectionTime: (m) => `${m} min`,
  prevLesson: 'Previous lesson', nextLesson: 'Next lesson', markComplete: 'Mark as complete', markIncomplete: 'Mark as incomplete', completed: 'Completed',
  overview: 'Overview', resources: 'Resources', qa: 'Q&A', noResources: 'No resources for this lesson.', download: 'Download', openLink: 'Open link',
  hideCurriculum: 'Hide course content', showCurriculum: 'Show course content',
  videoNotReadyT: 'Video not uploaded yet', videoNotReadyD: 'It will appear here as soon as the instructor adds it.',
  playbackErrorT: 'The video can’t be played', playbackErrorD: 'This may be a connection problem. Try again — playback resumes where you were.',
  lockedT: 'Buy the course to watch this lesson', lockedD: 'Every lesson unlocks after purchase.',
  loadingVideo: 'Loading video…', saving: 'Saving…', saved: 'Progress saved', saveFailed: 'Progress not saved — retrying',
  watchHint: 'This lesson completes automatically once you’ve watched 90% of the video.', readingHint: 'Mark the lesson complete when you’ve finished reading.',
  quizHint: 'This lesson completes when you submit the quiz.', assignmentHint: 'This lesson completes when you submit the assignment.', openQuiz: 'Take the quiz', submitAssignment: 'Submit assignment',
  courseDoneT: 'Congratulations — course complete!', courseDoneD: 'You’ve finished every lesson. Claim your certificate from My learning.',
  endOfCourseT: 'This is the last lesson', endOfCourseD: 'Finish any remaining lessons from the list.', managerNote: 'Staff review mode — progress isn’t saved.',
  speed: 'Speed', captionsLbl: 'Captions',
  type_video: 'Video', type_pdf: 'Reading', type_quiz: 'Quiz', type_assignment: 'Assignment',

  mlTitle: 'My learning', mlSub: 'Your courses and progress.', tabAll: 'All', tabInProgress: 'In progress', tabCompleted: 'Completed', tabNotStarted: 'Not started',
  mlEmptyT: 'No courses yet', mlEmptyD: 'Courses you buy or enroll in for free will appear here.', browseCourses: 'Browse courses',
  mlEmptyFilter: 'Nothing in this list.', percentDone: (p) => `${p}% complete`, lastViewed: 'Last viewed', start: 'Start', resume: 'Resume',
  noLessonsYet: 'The instructor will add lessons soon.', certificate: 'Certificate', getCertificate: 'Get certificate', viewCertificate: 'View certificate',
  ordersTitle: 'Orders & payments', ordersEmpty: 'No orders yet.', date: 'Date', amount: 'Amount', items: 'Courses',
  accountTitle: 'Account settings', changePassword: 'Change password', currentPassword: 'Current password', newPassword: 'New password', savePassword: 'Save password',
  passwordChanged: 'Password changed.', err_wrong_password: 'Current password is incorrect.', profile: 'Profile',
  more: 'More', wishlist: 'Wishlist', liveClasses: 'Live classes', quizzes: 'Quizzes', certificates: 'Certificates', referral: 'Referrals', career: 'Careers'
};

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export function toBn(n) {
  return String(n).replace(/\d/g, (d) => BN_DIGITS[d]);
}

export const COPY = { bn, en };
export function copy(lang) { return lang === 'en' ? en : bn; }

// Numbers/prices/durations formatted for the active language.
export function num(lang, n) { return lang === 'en' ? Number(n).toLocaleString('en-US') : toBn(Number(n).toLocaleString('en-IN')); }
export function taka(lang, n) { return `৳${num(lang, n)}`; }
export function duration(lang, seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0));
  const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60);
  if (lang === 'en') return h ? `${h}h ${m}m` : `${m || 1}m`;
  return h ? `${toBn(h)} ঘণ্টা ${toBn(m)} মিনিট` : `${toBn(m || 1)} মিনিট`;
}
export function clock(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const pad = (x) => String(x).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}
export function dateLabel(lang, value) {
  if (!value) return '';
  const d = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(lang === 'en' ? 'en-GB' : 'bn-BD', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Dhaka' });
}

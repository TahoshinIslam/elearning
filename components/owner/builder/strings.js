// Admin course-builder copy (bn/en).
const bn = {
  courses: 'কোর্স', newCourse: 'নতুন কোর্স', newCoursePh: 'কোর্সের নাম', create: 'তৈরি করুন', search: 'কোর্স খুঁজুন',
  colCourse: 'কোর্স', colStatus: 'অবস্থা', colPrice: 'দাম', colLessons: 'লেসন', colStudents: 'শিক্ষার্থী', colUpdated: 'আপডেট', edit: 'এডিট', view: 'পেজ দেখুন',
  draft: 'ড্রাফট', published: 'প্রকাশিত', pending: 'রিভিউতে', back: 'সব কোর্স', empty: 'এখনো কোনো কোর্স নেই। প্রথম কোর্সটি তৈরি করুন।',
  tabDetails: 'বিবরণ', tabCurriculum: 'পাঠ্যক্রম', tabMedia: 'মিডিয়া', tabPricing: 'দাম', tabPublish: 'প্রকাশ', tabStudents: 'শিক্ষার্থী ও অর্ডার',
  classLevel: 'শ্রেণি', upcomingBadge: 'আসন্ন', featuredBadge: 'নির্বাচিত', classify: 'শ্রেণিবিন্যাস', content: 'কোর্সের বিষয়বস্তু', upcoming: 'আসন্ন কোর্স হিসেবে ঘোষণা করুন', upcomingHelp: 'ঘোষণায় শুধু নাম, বিবরণ ও প্রকাশের তারিখ দেখাবে — কোনো লেসন বা কেনার সুযোগ নয়। আগ্রহীরা “জানাবেন” তালিকায় যোগ দিতে পারবে।', releaseDate: 'প্রকাশের তারিখ (ঐচ্ছিক)', tba: 'তারিখ পরে জানানো হবে', waitlist: 'অপেক্ষমাণ তালিকায়', saveAnnouncement: 'ঘোষণা সংরক্ষণ', e_announcement_needs_summary: 'ঘোষণার আগে ট্যাগলাইন বা বিবরণ দিন।', e_already_published: 'প্রকাশিত কোর্স আসন্ন হিসেবে ঘোষণা করা যায় না।', e_invalid_date: 'তারিখ সঠিক নয়।',
  activeOffers: 'এই কোর্সে চলমান অফার', noOffers: 'কোনো চলমান অফার নেই। ছাড় দিতে “অফার” বিভাগে অফার তৈরি করুন — ক্যাটালগ, কোর্স পেজ ও চেকআউটে একই দাম দেখাবে।', customersPay: 'শিক্ষার্থী পরিশোধ করবেন', visibility: 'দৃশ্যমানতা', featuredHelp: 'হোমপেজের “নির্বাচিত কোর্স” অংশে দেখাবে। ক্রম কোর্স তালিকা থেকে বদলান।', mediaHelp: 'থাম্বনেইল ক্যাটালগ, হোমপেজ, কোর্স পেজ ও শেয়ার প্রিভিউতে ব্যবহৃত হয়।', danger: 'বিপজ্জনক কাজ', stats: 'পরিসংখ্যান', purchasers: 'যাচাইকৃত ক্রেতা', reviews: 'প্রকাশিত রিভিউ', pendingReviews: 'অনুমোদনের অপেক্ষায়',
  title: 'কোর্সের নাম', slug: 'URL স্লাগ', slugLocked: 'প্রকাশিত কোর্সের URL বদলানো যায় না (পুরোনো লিংক ভেঙে যাবে)।', tagline: 'সংক্ষিপ্ত বিবরণ (ট্যাগলাইন)', description: 'বিস্তারিত বিবরণ',
  category: 'বিষয়', level: 'লেভেল', language: 'ভাষা', mode: 'ধরন', instructor: 'ইন্সট্রাক্টর', none: '— নেই —', durationLabel: 'সময়কাল (লেবেল, যেমন “৬ সপ্তাহ”)',
  outcomes: 'যা শিখবে (প্রতি লাইনে একটি)', requirements: 'পূর্বশর্ত (প্রতি লাইনে একটি)', audience: 'কাদের জন্য (প্রতি লাইনে একটি)',
  faqs: 'কোর্স FAQ', faqQ: 'প্রশ্ন', faqA: 'উত্তর', addFaq: 'প্রশ্ন যোগ করুন', remove: 'সরান', thumbnail: 'থাম্বনেইল', uploadImage: 'ছবি আপলোড', replace: 'বদলান',
  featured: 'হোমপেজে ফিচার করুন', save: 'সেভ করুন', saved: 'সেভ হয়েছে', saving: 'সেভ হচ্ছে…', unsaved: 'সেভ না করা পরিবর্তন আছে',
  addSection: 'সেকশন যোগ করুন', sectionPh: 'সেকশনের নাম', addLesson: 'লেসন যোগ করুন', lessonPh: 'লেসনের নাম', moveUp: 'উপরে', moveDown: 'নিচে',
  deleteSection: 'সেকশন মুছুন', deleteLesson: 'লেসন মুছুন', preview: 'ফ্রি প্রিভিউ', editLesson: 'লেসন এডিট', dragHint: 'টেনে বা উপরে/নিচে বোতামে ক্রম বদলান। ক্রম সাথে সাথে সেভ হয়।',
  v_ready: 'ভিডিও প্রস্তুত', v_pending: 'আপলোড অসম্পূর্ণ', v_failed: 'আপলোড ব্যর্থ', v_missing: 'ভিডিও নেই',
  lessonTitle: 'লেসনের নাম', lessonSummary: 'লেসনের বিবরণ', lessonType: 'ধরন', moveTo: 'সেকশনে সরান', previewHelp: 'প্রিভিউ লেসন কেনার আগেই সবাই দেখতে পারবে (শুধু ভিডিও লেসন ও প্রকাশিত কোর্সে)।',
  video: 'ভিডিও', uploadVideo: 'ভিডিও আপলোড', uploading: 'আপলোড হচ্ছে', verifying: 'যাচাই হচ্ছে…', videoTypes: 'MP4, WebM বা MOV · সর্বোচ্চ ৪ GB', removeVideo: 'ভিডিও সরান',
  captions: 'সাবটাইটেল (WebVTT)', captionLang: 'ভাষা কোড (যেমন bn, en)', captionLabel: 'লেবেল', uploadCaption: '.vtt আপলোড',
  resources: 'রিসোর্স', addLink: 'লিংক যোগ', linkTitle: 'শিরোনাম', linkUrl: 'URL (https://)', uploadFile: 'ফাইল আপলোড', noResources: 'কোনো রিসোর্স নেই।',
  price: 'দাম (৳)', oldPrice: 'নিয়মিত দাম (কেটে দেখানো হবে, ঐচ্ছিক)', threshold: 'সার্টিফিকেটের জন্য সম্পন্ন করতে হবে (%)',
  checklist: 'প্রকাশের আগে যা লাগবে', publish: 'প্রকাশ করুন', unpublish: 'প্রকাশ বন্ধ করুন', unpublishNote: 'প্রকাশ বন্ধ করলে ক্যাটালগ থেকে সরে যাবে, তবে যারা কিনেছে তাদের অ্যাক্সেস থাকবে।',
  ck_title: 'নাম', ck_description: 'বিস্তারিত বিবরণ', ck_price: 'দাম', ck_level: 'লেভেল', ck_language: 'ভাষা', ck_lessons: 'অন্তত একটি লেসন', ck_empty_sections: 'কোনো খালি সেকশন নেই', ck_videos_not_ready: 'সব ভিডিও লেসনে প্রস্তুত ভিডিও',
  deleteCourse: 'কোর্স মুছুন', deleteConfirm: 'কোর্সটি স্থায়ীভাবে মুছে যাবে। নিশ্চিত?', confirmDeleteLesson: 'লেসনটি মুছে ফেলবেন?', confirmDeleteSection: 'সেকশন ও এর সব লেসন মুছে ফেলবেন?',
  enrolled: 'সক্রিয় শিক্ষার্থী', paidOrders: 'পরিশোধিত অর্ডার', openPayments: 'পেমেন্ট ট্যাবে সব অর্ডার দেখুন', studentList: 'ভর্তি শিক্ষার্থী', noStudents: 'এখনো কেউ ভর্তি হয়নি।',
  e_has_learner_data: 'এই লেসনে শিক্ষার্থীদের অগ্রগতি/জমা আছে — মুছে ফেলা যাবে না। প্রয়োজনে শিরোনাম বদলান।', e_unpublish_first: 'আগে কোর্সের প্রকাশ বন্ধ করুন।',
  e_course_has_students: 'এই কোর্সে শিক্ষার্থী/অর্ডার আছে — মুছে ফেলা যাবে না। প্রকাশ বন্ধ করুন।', e_incomplete_course: 'প্রকাশের শর্ত পূরণ হয়নি:', e_invalid_price: 'দাম সঠিক নয় (০ বা ধনাত্মক পূর্ণসংখ্যা)।',
  e_old_price: 'নিয়মিত দাম বর্তমান দামের চেয়ে বেশি হতে হবে।', e_storage_not_configured: 'ফাইল স্টোরেজ কনফিগার করা নেই (STORAGE_*)।', e_unsupported_video_type: 'এই ধরনের ভিডিও সমর্থিত নয়।',
  e_file_too_large: 'ফাইলটি অনেক বড়।', e_upload_not_found: 'আপলোড সম্পন্ন হয়নি — আবার চেষ্টা করুন।', e_slug_locked_when_published: 'প্রকাশিত কোর্সের URL বদলানো যায় না।', e_description_required: 'প্রকাশিত কোর্সের বিবরণ খালি রাখা যাবে না।',
  e_generic: 'কাজটি সম্পন্ন হয়নি। আবার চেষ্টা করুন।', e_invalid_url: 'সঠিক https:// লিংক দিন।', e_unsupported_file_type: 'এই ধরনের ফাইল সমর্থিত নয়।', e_invalid_lang: 'ভাষা কোড সঠিক নয়।',
  done: 'সম্পন্ন', close: 'বন্ধ করুন', type_video: 'ভিডিও', type_pdf: 'পড়া', type_quiz: 'কুইজ', type_assignment: 'অ্যাসাইনমেন্ট'
};
const en = {
  courses: 'Courses', newCourse: 'New course', newCoursePh: 'Course title', create: 'Create', search: 'Search courses',
  colCourse: 'Course', colStatus: 'Status', colPrice: 'Price', colLessons: 'Lessons', colStudents: 'Students', colUpdated: 'Updated', edit: 'Edit', view: 'View page',
  draft: 'Draft', published: 'Published', pending: 'In review', back: 'All courses', empty: 'No courses yet. Create your first course.',
  tabDetails: 'Details', tabCurriculum: 'Curriculum', tabMedia: 'Media', tabPricing: 'Pricing', tabPublish: 'Publishing', tabStudents: 'Students & orders',
  classLevel: 'Class', upcomingBadge: 'Upcoming', featuredBadge: 'Featured', classify: 'Classification', content: 'Course content', upcoming: 'Announce as an upcoming course', upcomingHelp: 'The announcement shows only the title, description and release date — no lessons and no purchase. Visitors can join the “Notify me” list.', releaseDate: 'Release date (optional)', tba: 'To be announced', waitlist: 'on the waitlist', saveAnnouncement: 'Save announcement', e_announcement_needs_summary: 'Add a tagline or description before announcing.', e_already_published: 'A published course can’t be announced as upcoming.', e_invalid_date: 'Invalid date.',
  activeOffers: 'Live offers on this course', noOffers: 'No live offers. To discount this course, create an offer in “Offers” — the catalog, course page and checkout all show the same price.', customersPay: 'Customers pay', visibility: 'Visibility', featuredHelp: 'Shown in the homepage “Featured” section. Change the order from the course list.', mediaHelp: 'The thumbnail is used in the catalog, homepage, course page and share previews.', danger: 'Danger zone', stats: 'Statistics', purchasers: 'Verified purchasers', reviews: 'Published reviews', pendingReviews: 'Awaiting approval',
  title: 'Course title', slug: 'URL slug', slugLocked: 'A published course’s URL can’t change (existing links would break).', tagline: 'Short summary (tagline)', description: 'Full description',
  category: 'Topic', level: 'Level', language: 'Language', mode: 'Format', instructor: 'Instructor', none: '— none —', durationLabel: 'Duration label (e.g. “6 weeks”)',
  outcomes: 'Learning outcomes (one per line)', requirements: 'Prerequisites (one per line)', audience: 'Intended audience (one per line)',
  faqs: 'Course FAQ', faqQ: 'Question', faqA: 'Answer', addFaq: 'Add question', remove: 'Remove', thumbnail: 'Thumbnail', uploadImage: 'Upload image', replace: 'Replace',
  featured: 'Feature on homepage', save: 'Save', saved: 'Saved', saving: 'Saving…', unsaved: 'You have unsaved changes',
  addSection: 'Add section', sectionPh: 'Section title', addLesson: 'Add lesson', lessonPh: 'Lesson title', moveUp: 'Move up', moveDown: 'Move down',
  deleteSection: 'Delete section', deleteLesson: 'Delete lesson', preview: 'Free preview', editLesson: 'Edit lesson', dragHint: 'Drag, or use the up/down buttons, to reorder. Order is saved immediately.',
  v_ready: 'Video ready', v_pending: 'Upload incomplete', v_failed: 'Upload failed', v_missing: 'No video',
  lessonTitle: 'Lesson title', lessonSummary: 'Lesson description', lessonType: 'Type', moveTo: 'Move to section', previewHelp: 'Preview lessons can be watched by anyone before buying (video lessons of published courses only).',
  video: 'Video', uploadVideo: 'Upload video', uploading: 'Uploading', verifying: 'Verifying…', videoTypes: 'MP4, WebM or MOV · up to 4 GB', removeVideo: 'Remove video',
  captions: 'Captions (WebVTT)', captionLang: 'Language code (e.g. bn, en)', captionLabel: 'Label', uploadCaption: 'Upload .vtt',
  resources: 'Resources', addLink: 'Add link', linkTitle: 'Title', linkUrl: 'URL (https://)', uploadFile: 'Upload file', noResources: 'No resources.',
  price: 'Price (৳)', oldPrice: 'Regular price (shown struck through, optional)', threshold: 'Completion required for certificate (%)',
  checklist: 'Needed before publishing', publish: 'Publish', unpublish: 'Unpublish', unpublishNote: 'Unpublishing removes it from the catalog; students who bought it keep access.',
  ck_title: 'Title', ck_description: 'Full description', ck_price: 'Price', ck_level: 'Level', ck_language: 'Language', ck_lessons: 'At least one lesson', ck_empty_sections: 'No empty sections', ck_videos_not_ready: 'Every video lesson has a ready video',
  deleteCourse: 'Delete course', deleteConfirm: 'This permanently deletes the course. Continue?', confirmDeleteLesson: 'Delete this lesson?', confirmDeleteSection: 'Delete this section and all its lessons?',
  enrolled: 'Active students', paidOrders: 'Paid orders', openPayments: 'See all orders in the Payments tab', studentList: 'Enrolled students', noStudents: 'No one has enrolled yet.',
  e_has_learner_data: 'Students have progress or submissions on this lesson — it can’t be deleted. Rename it instead.', e_unpublish_first: 'Unpublish the course first.',
  e_course_has_students: 'This course has students or orders — it can’t be deleted. Unpublish it instead.', e_incomplete_course: 'Not ready to publish:', e_invalid_price: 'Price must be a whole number of 0 or more.',
  e_old_price: 'Regular price must be higher than the price.', e_storage_not_configured: 'File storage isn’t configured (STORAGE_*).', e_unsupported_video_type: 'That video type isn’t supported.',
  e_file_too_large: 'That file is too large.', e_upload_not_found: 'The upload didn’t complete — please try again.', e_slug_locked_when_published: 'A published course’s URL can’t change.', e_description_required: 'A published course needs a description.',
  e_generic: 'That didn’t work. Please try again.', e_invalid_url: 'Enter a valid https:// link.', e_unsupported_file_type: 'That file type isn’t supported.', e_invalid_lang: 'Invalid language code.',
  done: 'Done', close: 'Close', type_video: 'Video', type_pdf: 'Reading', type_quiz: 'Quiz', type_assignment: 'Assignment'
};
export const S = (lang) => (lang === 'en' ? en : bn);
export const errText = (s, e) => {
  const code = e?.data?.error || e?.message;
  if (code === 'incomplete_course') return `${s.e_incomplete_course} ${(e.data.missing || []).map((m) => s[`ck_${m}`] || m).join(', ')}`;
  return s[`e_${code}`] || s.e_generic;
};

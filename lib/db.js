// In-memory database (server side).
// In production this is where PostgreSQL + Prisma would plug in —
// the API route handlers would stay almost identical.

const g = globalThis;

if (!g.__LEO_DB__) {
  g.__LEO_DB__ = {
    students: [
      { id: 1, name: 'তানভীর আহমেদ', phone: '01712-334455', batch: 'HSC ফিজিক্স — ব্যাচ ৩', amount: 1500, paid: false },
      { id: 2, name: 'সুমাইয়া ইসলাম', phone: '01818-990011', batch: 'HSC ফিজিক্স — ব্যাচ ৩', amount: 1500, paid: true },
      { id: 3, name: 'রাকিব হাসান', phone: '01917-556677', batch: 'SSC গণিত — সকাল', amount: 1200, paid: false },
      { id: 4, name: 'নুসরাত জাহান', phone: '01611-223344', batch: 'SSC গণিত — সকাল', amount: 1200, paid: true },
      { id: 5, name: 'মেহেদী হাসান', phone: '01715-887799', batch: 'HSC ফিজিক্স — ব্যাচ ৩', amount: 1500, paid: true }
    ],
    // batch.courseId → courses[].id (null = not linked to a course yet)
    batches: [
      { id: 1, name: 'HSC ফিজিক্স — ব্যাচ ৩', courseId: 1, students: 32, fee: '1,500', time: 'শনি-সোম-বুধ · সন্ধ্যা ৭টা' },
      { id: 2, name: 'SSC গণিত — সকাল', courseId: 2, students: 24, fee: '1,200', time: 'রবি-মঙ্গল · সকাল ১০টা' },
      { id: 3, name: 'ফ্রি স্টার্টার — ওপেন', courseId: 3, students: 512, fee: '0', time: 'সেল্ফ-পেসড · যেকোনো সময়' }
    ],
    teachers: [
      { id: 1, name: 'আবরার হায়দার', subject: 'ফিজিক্স', phone: '01712-889900', batches: ['HSC ফিজিক্স — ব্যাচ ৩'],
        title: 'সিনিয়র ফিজিক্স ইন্সট্রাক্টর', rating: 4.8, ratingCount: 214, studentsTaught: 1240,
        expertise: ['বলবিদ্যা', 'তড়িৎ ও চুম্বকত্ব', 'আধুনিক পদার্থবিজ্ঞান'],
        bio: '১০ বছরের বেশি সময় ধরে HSC ও ভর্তি পরীক্ষার শিক্ষার্থীদের পড়াচ্ছেন। জটিল ধারণা সহজ উদাহরণে বোঝানোই তাঁর বিশেষত্ব।' },
      { id: 2, name: 'সৌরভ বড়ুয়া', subject: 'ফিজিক্স (সাপোর্ট)', phone: '01815-667788', batches: ['HSC ফিজিক্স — ব্যাচ ৩'],
        title: 'সাপোর্ট ইন্সট্রাক্টর', rating: 4.6, ratingCount: 88, studentsTaught: 430,
        expertise: ['সমস্যা সমাধান', 'MCQ কৌশল'],
        bio: 'সাপোর্ট ক্লাস ও হোমওয়ার্ক রিভিউতে বিশেষজ্ঞ, শিক্ষার্থীদের দুর্বলতা ধরে ধরে ঠিক করেন।' },
      { id: 3, name: 'মেহজাবিন রহমান', subject: 'গণিত', phone: '01911-223300', batches: ['SSC গণিত — সকাল'],
        title: 'সিনিয়র গণিত ইন্সট্রাক্টর', rating: 4.7, ratingCount: 132, studentsTaught: 760,
        expertise: ['বীজগণিত', 'জ্যামিতি', 'ত্রিকোণমিতি'],
        bio: 'SSC উচ্চতর গণিতে দীর্ঘদিনের অভিজ্ঞ শিক্ষক। ধাপে ধাপে সমাধান শেখানোই তাঁর পদ্ধতি।' }
    ],
    tenants: [
      { id: 1, name: 'আলোর পথ কোচিং', sub: 'alorpath', plan: 'Pro', students: 128, mrr: '1,500', status: 'active' },
      { id: 2, name: 'মেধা একাডেমি', sub: 'medha', plan: 'Basic', students: 46, mrr: '800', status: 'active' },
      { id: 3, name: 'সাফল্য কেয়ার', sub: 'safollo', plan: 'Trial', students: 19, mrr: '0', status: 'trial' },
      { id: 4, name: 'জ্ঞানকোষ সেন্টার', sub: 'gyankosh', plan: 'Pro', students: 210, mrr: '1,500', status: 'active' },
      { id: 5, name: 'দিগন্ত টিউটোরিয়াল', sub: 'diganta', plan: 'Basic', students: 33, mrr: '800', status: 'suspended' }
    ],
    // Payment = a persisted transaction/invoice (created only when amount > 0).
    // type: enrollment | fee ; status: success | refunded
    payments: [
      { id: 1, studentId: 1, studentName: 'তানভীর আহমেদ', courseId: 1, batchId: 1, amount: 1500, method: 'bkash', type: 'enrollment', status: 'success', trxId: 'TRX9GK4A2LX', invoiceNo: 'INV-2026-0001', createdAt: '2026-06-01' },
      { id: 2, studentId: 2, studentName: 'সুমাইয়া ইসলাম', courseId: 1, batchId: 1, amount: 1500, method: 'bkash', type: 'fee', status: 'success', trxId: 'TRX7HL2B93K', invoiceNo: 'INV-2026-0002', createdAt: '2026-06-05' }
    ],
    // Certificate = issued once a student's course completion >= CERT_THRESHOLD (80%).
    // Seeded empty: earned live in the demo (submit the remaining assignment → cross 80%).
    certificates: [],
    // Career portal — jobs (posted by HQ/centers) and student applications.
    jobs: [
      { id: 1, title: 'জুনিয়র ফিজিক্স টিউটর', company: 'আলোর পথ কোচিং', location: 'ঢাকা', type: 'full-time', salary: '২৫,০০০', skills: ['ফিজিক্স', 'HSC'], postedAt: '2026-07-01', open: true },
      { id: 2, title: 'কন্টেন্ট রাইটার (গণিত)', company: 'মেধা একাডেমি', location: 'রিমোট', type: 'part-time', salary: '১৫,০০০', skills: ['গণিত', 'লেখালেখি'], postedAt: '2026-06-28', open: true },
      { id: 3, title: 'ল্যাব অ্যাসিস্ট্যান্ট', company: 'জ্ঞানকোষ সেন্টার', location: 'চট্টগ্রাম', type: 'internship', salary: '১০,০০০', skills: ['কেমিস্ট্রি'], postedAt: '2026-06-20', open: false }
    ],
    // application.status: applied | shortlisted | interview | hired | rejected
    applications: [
      { id: 1, jobId: 1, studentId: 1, studentName: 'তানভীর আহমেদ', status: 'shortlisted', appliedAt: '2026-07-02' }
    ],
    // Submission = a student's work for an assignment-type lesson. Teacher grades it.
    // status: 'submitted' (awaiting grading) | 'graded' (has marks + feedback)
    submissions: [
      { id: 1, lessonId: 123, courseId: 1, studentId: 1, studentName: 'তানভীর আহমেদ', content: 'বলবিদ্যার সমস্যাগুলোর সমাধান সংযুক্ত করা হলো।', submittedAt: '2026-07-02', status: 'graded', marks: 18, maxMarks: 20, feedback: 'চমৎকার! ঘর্ষণ অংশে আরও যত্নবান হও।' },
      { id: 2, lessonId: 123, courseId: 1, studentId: 2, studentName: 'সুমাইয়া ইসলাম', content: 'সমাধান জমা দিলাম।', submittedAt: '2026-07-04', status: 'submitted', marks: null, maxMarks: 20, feedback: null }
    ],
    // Enrollment = student ↔ batch join (grants access to the batch's course).
    // The student portal represents student id 1 (তানভীর আহমেদ).
    enrollments: [
      { id: 1, studentId: 1, batchId: 1, courseId: 1, enrolledAt: '2026-06-01', status: 'active' },
      { id: 2, studentId: 2, batchId: 1, courseId: 1, enrolledAt: '2026-06-01', status: 'active' },
      { id: 3, studentId: 5, batchId: 1, courseId: 1, enrolledAt: '2026-06-03', status: 'active' }
    ],
    // Attendance = one row per student per class date. Teacher marks it; completion derives from it.
    attendance: [
      { id: 1, studentId: 1, batchId: 1, date: '2026-07-02', title: 'লাইভ ক্লাস — কাজ, শক্তি ও ক্ষমতা', present: true },
      { id: 2, studentId: 1, batchId: 1, date: '2026-06-30', title: 'সাপোর্ট ক্লাস — মডিউল ৮', present: true },
      { id: 3, studentId: 1, batchId: 1, date: '2026-06-29', title: 'লাইভ ক্লাস — ভেক্টর রিভিশন', present: false },
      { id: 4, studentId: 1, batchId: 1, date: '2026-06-27', title: 'লাইভ ক্লাস — নিউটনের সূত্র', present: true },
      { id: 5, studentId: 1, batchId: 1, date: '2026-06-25', title: 'মডেল টেস্ট ৭', present: true },
      { id: 6, studentId: 1, batchId: 1, date: '2026-06-22', title: 'লাইভ ক্লাস — মহাকর্ষ ও অভিকর্ষ', present: true },
      { id: 7, studentId: 2, batchId: 1, date: '2026-07-02', title: 'লাইভ ক্লাস — কাজ, শক্তি ও ক্ষমতা', present: true },
      { id: 8, studentId: 5, batchId: 1, date: '2026-07-02', title: 'লাইভ ক্লাস — কাজ, শক্তি ও ক্ষমতা', present: false }
    ],
    // Live classes — teacher schedules with a Zoom URL, clicks Start (scheduled→live),
    // students join (server verifies enrolled + live), teacher ends (live→ended) + recording.
    liveClasses: [
      { id: 1, courseId: 1, batchId: 1, instructorId: 1, title: 'নিউটনিয়ান বলবিদ্যা — কাজ, শক্তি ও ক্ষমতা', classDate: '2026-07-06', startTime: 'সন্ধ্যা ৭:০০', endTime: 'রাত ৯:০০', zoomUrl: 'https://zoom.us/j/1112223334', status: 'live', recordingUrl: null },
      { id: 2, courseId: 1, batchId: 1, instructorId: 1, title: 'পর্যাবৃত্ত গতি — সরল ছন্দিত স্পন্দন', classDate: '2026-07-08', startTime: 'সন্ধ্যা ৭:০০', endTime: 'রাত ৯:০০', zoomUrl: 'https://zoom.us/j/2223334445', status: 'scheduled', recordingUrl: null },
      { id: 3, courseId: 1, batchId: 1, instructorId: 1, title: 'ভেক্টর রিভিশন ক্লাস', classDate: '2026-06-29', startTime: 'সন্ধ্যা ৭:০০', endTime: 'রাত ৯:০০', zoomUrl: 'https://zoom.us/j/3334445556', status: 'ended', recordingUrl: 'https://recordings.leolearning.app/vec-rev' }
    ],
    // Course → Module → Lesson. lesson.type ∈ video | pdf | quiz | assignment.
    // Nested ids are < 1000; nextId() starts above that so generated ids never collide.
    courses: [
      {
        id: 1,
        title: 'HSC পদার্থবিজ্ঞান — সম্পূর্ণ কোর্স',
        slug: 'hsc-physics',
        published: true,
        category: 'physics',
        mode: 'hybrid',
        thumb: 'ফিজিক্স',
        tagline: 'HSC পদার্থবিজ্ঞানের সম্পূর্ণ সিলেবাস — লাইভ ক্লাস, সাপ্তাহিক টেস্ট আর অ্যাসাইনমেন্টসহ।',
        level: 'HSC (একাদশ–দ্বাদশ)',
        language: 'বাংলা',
        instructor: 'আবরার হায়দার',
        instructorId: 1,
        price: 1500,
        oldPrice: 2500,
        rating: 4.8,
        ratingCount: 214,
        duration: '৪ মাস · ৪৮টি লাইভ ক্লাস',
        description: 'এই কোর্সে HSC পদার্থবিজ্ঞানের পুরো সিলেবাস ধাপে ধাপে কভার করা হবে। প্রতিটি অধ্যায়ে লাইভ ক্লাস, প্র্যাকটিস শিট, সাপ্তাহিক মডেল টেস্ট এবং ব্যক্তিগত ফিডব্যাক থাকবে। ক্লাস মিস করলে রেকর্ডিং দেখে নেওয়া যাবে।',
        whatYouLearn: [
          'ভেক্টর, বলবিদ্যা ও গতিবিদ্যার শক্ত ভিত্তি',
          'বোর্ড ও ভর্তি পরীক্ষার সমস্যা সমাধানের কৌশল',
          'প্রতি অধ্যায়ে মডেল টেস্ট ও বিশ্লেষণ',
          'CQ ও MCQ — দুই ধরনের প্রশ্নেই দক্ষতা'
        ],
        requirements: [
          'একাদশ/দ্বাদশ শ্রেণির শিক্ষার্থী',
          'বেসিক গণিতের ধারণা',
          'স্মার্টফোন/কম্পিউটার ও ইন্টারনেট'
        ],
        faqs: [
          { q: 'ক্লাস মিস হলে কী হবে?', a: 'প্রতিটি ক্লাসের রেকর্ডিং পাওয়া যাবে, যেকোনো সময় দেখতে পারবেন।' },
          { q: 'পেমেন্ট কীভাবে করব?', a: 'bKash/নগদ বা কার্ডের মাধ্যমে একবার কোর্স ফি পরিশোধ করলেই আজীবন এক্সেস পাওয়া যাবে।' },
          { q: 'সার্টিফিকেট পাব?', a: 'কোর্স ৮০% সম্পন্ন করলে সার্টিফিকেট পাওয়া যাবে।' }
        ],
        reviews: [
          { name: 'সুমাইয়া ইসলাম', rating: 5, text: 'ছোট গ্রুপে পড়ানোর কারণে প্রতিটা প্রশ্ন করার সুযোগ পেয়েছি।' },
          { name: 'রাকিব হাসান', rating: 4, text: 'রেকর্ডিং আর সাপোর্ট ক্লাস খুবই সহায়ক ছিল।' }
        ],
        modules: [
          {
            id: 11, title: 'মডিউল ১: ভেক্টর ও স্কেলার',
            lessons: [
              { id: 111, title: 'ভেক্টর ও স্কেলারের ধারণা', type: 'video', duration: '৪২ মিনিট', free: true },
              { id: 112, title: 'ভেক্টর যোগ, বিয়োগ ও গুণন', type: 'video', duration: '৩৮ মিনিট', free: true },
              { id: 113, title: 'অধ্যায় ১ — শিট (PDF)', type: 'pdf' },
              { id: 114, title: 'অধ্যায় ১ কুইজ', type: 'quiz' },
              { id: 115, title: 'অ্যাসাইনমেন্ট ১.১ — ভেক্টর সমস্যা', type: 'assignment' }
            ]
          },
          {
            id: 12, title: 'মডিউল ২: নিউটনীয় বলবিদ্যা',
            lessons: [
              { id: 121, title: 'গতির তিনটি সূত্র', type: 'video', duration: '৫০ মিনিট' },
              { id: 122, title: 'ঘর্ষণ ও টান', type: 'video', duration: '৩৫ মিনিট' },
              { id: 123, title: 'অ্যাসাইনমেন্ট ১ — বলবিদ্যা', type: 'assignment' }
            ]
          }
        ]
      },
      {
        id: 2,
        title: 'SSC উচ্চতর গণিত — লাইভ ব্যাচ',
        slug: 'ssc-higher-math',
        published: false,
        category: 'math',
        mode: 'live',
        thumb: 'ম্যাথ',
        tagline: 'SSC উচ্চতর গণিতের প্রতিটি অধ্যায় সহজভাবে — লাইভ ক্লাস ও প্র্যাকটিসসহ।',
        level: 'SSC (নবম–দশম)',
        language: 'বাংলা',
        instructor: 'মেহজাবিন রহমান',
        instructorId: 3,
        price: 1200,
        oldPrice: 1800,
        rating: 4.6,
        ratingCount: 96,
        duration: '৩ মাস · ৩৬টি ক্লাস',
        description: 'SSC উচ্চতর গণিতের সেট, ফাংশন, বীজগণিত ও জ্যামিতি — প্রতিটি অধ্যায় লাইভ ক্লাসে বিস্তারিতভাবে শেখানো হবে।',
        whatYouLearn: [
          'সেট ও ফাংশনের মৌলিক ধারণা',
          'বীজগণিতের সমস্যা সমাধান',
          'বোর্ড পরীক্ষার প্রস্তুতি'
        ],
        requirements: ['নবম/দশম শ্রেণির শিক্ষার্থী', 'সাধারণ গণিতের ধারণা'],
        faqs: [
          { q: 'ক্লাসের সময় কখন?', a: 'সপ্তাহে ৩ দিন সন্ধ্যায় লাইভ ক্লাস হবে।' },
          { q: 'রেকর্ডিং পাব?', a: 'হ্যাঁ, প্রতিটি ক্লাসের রেকর্ডিং পাওয়া যাবে।' }
        ],
        reviews: [
          { name: 'নুসরাত জাহান', rating: 5, text: 'গণিতের ভয় কেটে গেছে এই কোর্সে এসে।' }
        ],
        modules: [
          {
            id: 21, title: 'মডিউল ১: সেট ও ফাংশন',
            lessons: [
              { id: 211, title: 'সেটের ধারণা', type: 'video', duration: '৪০ মিনিট', free: true },
              { id: 212, title: 'ফাংশন ও তার প্রকারভেদ', type: 'video', duration: '৪৫ মিনিট' }
            ]
          }
        ]
      },
      {
        id: 3,
        title: 'ফ্রি স্টার্টার — পড়াশোনার হাতেখড়ি',
        slug: 'free-starter',
        published: true,
        category: 'skills',
        mode: 'recorded',
        thumb: 'ফ্রি',
        tagline: 'একদম বিনামূল্যে শুরু করুন — পড়াশোনার বেসিক কৌশল ও গাইডলাইন।',
        level: 'সকল শ্রেণি',
        language: 'বাংলা',
        instructor: 'Leo HQ',
        price: 0,
        oldPrice: 0,
        rating: 4.9,
        ratingCount: 512,
        duration: '২ সপ্তাহ · ৬টি লেসন',
        description: 'একটি সম্পূর্ণ বিনামূল্যের কোর্স যেখানে পড়াশোনার কার্যকর কৌশল, সময় ব্যবস্থাপনা ও পরীক্ষার প্রস্তুতির গাইডলাইন শেখানো হবে। এনরোল করলে অগ্রগতি ট্র্যাক হবে এবং সার্টিফিকেট পাওয়া যাবে।',
        whatYouLearn: ['কার্যকর পড়ার কৌশল', 'সময় ব্যবস্থাপনা', 'পরীক্ষার প্রস্তুতির পরিকল্পনা'],
        requirements: ['শেখার আগ্রহ', 'স্মার্টফোন/কম্পিউটার'],
        faqs: [
          { q: 'এটা কি সত্যিই ফ্রি?', a: 'হ্যাঁ, সম্পূর্ণ বিনামূল্যে — কোনো পেমেন্ট লাগবে না। শুধু এনরোল করলেই হবে।' }
        ],
        reviews: [
          { name: 'আরিফ হোসেন', rating: 5, text: 'ফ্রি হলেও কনটেন্ট দারুণ। শুরুর জন্য পারফেক্ট।' }
        ],
        modules: [
          {
            id: 31, title: 'মডিউল ১: শুরুর গাইড',
            lessons: [
              { id: 311, title: 'কীভাবে পড়লে মনে থাকে', type: 'video', duration: '১৮ মিনিট', free: true },
              { id: 312, title: 'রুটিন তৈরির সহজ নিয়ম', type: 'video', duration: '২২ মিনিট', free: true }
            ]
          }
        ]
      }
    ],
    nextId: 1000
  };
}

export const db = g.__LEO_DB__;

export function nextId() {
  db.nextId += 1;
  return db.nextId;
}

// Prototype data for the teacher panel. Bilingual via the `bn` flag.

export function todayClasses(bn) {
  return [
    {
      id: 'c1',
      time: bn ? 'সন্ধ্যা ৭:০০' : '7:00 PM',
      title: bn ? 'নিউটনিয়ান বলবিদ্যা — কাজ, শক্তি ও ক্ষমতা' : 'Newtonian Mechanics — Work, Energy & Power',
      batch: bn ? 'HSC ফিজিক্স — ব্যাচ ৩' : 'HSC Physics — Batch 3',
      room: bn ? 'রুম ২' : 'Room 2',
      live: true
    },
    {
      id: 'c2',
      time: bn ? 'রাত ৮:৩০' : '8:30 PM',
      title: bn ? 'সাপোর্ট ক্লাস — মডিউল ৮ রিভিশন' : 'Support class — Module 8 revision',
      batch: bn ? 'HSC ফিজিক্স — ব্যাচ ৩' : 'HSC Physics — Batch 3',
      room: bn ? 'অনলাইন' : 'Online',
      live: false
    }
  ];
}

// Columns follow t.days order: [Sat, Sun, Mon, Tue, Wed, Thu, Fri]
export function weekRoutine(bn) {
  const physics = bn ? 'HSC ফিজিক্স · ব্যাচ ৩' : 'HSC Physics · B3';
  const support = bn ? 'সাপোর্ট ক্লাস · ব্যাচ ৩' : 'Support · B3';
  const model = bn ? 'মডেল টেস্ট রিভিউ' : 'Model test review';
  return [
    { day: 0, slots: [{ time: bn ? 'সন্ধ্যা ৭:০০' : '7:00 PM', title: physics, room: bn ? 'রুম ২' : 'Room 2', kind: 'live' }] },
    { day: 1, slots: [] },
    { day: 2, slots: [{ time: bn ? 'সন্ধ্যা ৭:০০' : '7:00 PM', title: physics, room: bn ? 'রুম ২' : 'Room 2', kind: 'live' }] },
    { day: 3, slots: [{ time: bn ? 'সকাল ১১:০০' : '11:00 AM', title: support, room: bn ? 'অনলাইন' : 'Online', kind: 'support' }] },
    { day: 4, slots: [{ time: bn ? 'সন্ধ্যা ৭:০০' : '7:00 PM', title: physics, room: bn ? 'রুম ২' : 'Room 2', kind: 'live' }] },
    { day: 5, slots: [{ time: bn ? 'রাত ৮:০০' : '8:00 PM', title: model, room: bn ? 'অনলাইন' : 'Online', kind: 'support' }] },
    { day: 6, slots: [] }
  ];
}

export function teacherTasks(bn) {
  return [
    {
      id: 't1',
      type: 'grade',
      title: bn ? 'অ্যাসাইনমেন্ট ৮.১ — শক্তির সংরক্ষণ (২৪টি জমা)' : 'Assignment 8.1 — Conservation of energy (24 submissions)',
      batch: bn ? 'HSC ফিজিক্স — ব্যাচ ৩' : 'HSC Physics — Batch 3',
      due: bn ? '১০ জুলাই' : 'Jul 10',
      done: false
    },
    {
      id: 't2',
      type: 'upload',
      title: bn ? 'গতকালের লাইভ ক্লাসের রেকর্ডিং আপলোড করুন' : "Upload yesterday's live class recording",
      batch: bn ? 'HSC ফিজিক্স — ব্যাচ ৩' : 'HSC Physics — Batch 3',
      due: bn ? 'আজ' : 'Today',
      done: false
    },
    {
      id: 't3',
      type: 'prep',
      title: bn ? 'মডিউল ৯ স্টাডি প্ল্যান তৈরি করুন' : 'Prepare Module 9 study plan',
      batch: bn ? 'HSC ফিজিক্স — ব্যাচ ৩' : 'HSC Physics — Batch 3',
      due: bn ? '১২ জুলাই' : 'Jul 12',
      done: false
    },
    {
      id: 't4',
      type: 'grade',
      title: bn ? 'মডেল টেস্ট ৭ — খাতা দেখা শেষ' : 'Model Test 7 — grading complete',
      batch: bn ? 'HSC ফিজিক্স — ব্যাচ ৩' : 'HSC Physics — Batch 3',
      due: bn ? '২৫ জুন' : 'Jun 25',
      done: true
    }
  ];
}

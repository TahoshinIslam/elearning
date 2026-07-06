-- ============================================================
-- Leo Learning — seed data (migration 002)
-- Mirrors the demo data in lib/db.js. Run AFTER 001_init_schema.sql.
--   mysql -u root < database/migrations/002_seed.sql
-- Re-runnable: clears the tables first (FK checks off during load).
-- ============================================================

USE `e-learning`;
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM payments;            DELETE FROM live_classes;   DELETE FROM applications;
DELETE FROM job_skills;          DELETE FROM jobs;           DELETE FROM certificates;
DELETE FROM attendance;          DELETE FROM submissions;    DELETE FROM enrollments;
DELETE FROM students;            DELETE FROM teacher_batches;DELETE FROM batches;
DELETE FROM lessons;             DELETE FROM modules;
DELETE FROM course_reviews;      DELETE FROM course_faqs;    DELETE FROM course_requirements;
DELETE FROM course_learning_points;                          DELETE FROM courses;
DELETE FROM teacher_expertise;   DELETE FROM teachers;       DELETE FROM tenants;

-- ---------- tenants ----------
INSERT INTO tenants (id, name, sub, plan, students, mrr, status) VALUES
 (1,'আলোর পথ কোচিং','alorpath','Pro',128,1500,'active'),
 (2,'মেধা একাডেমি','medha','Basic',46,800,'active'),
 (3,'সাফল্য কেয়ার','safollo','Trial',19,0,'trial'),
 (4,'জ্ঞানকোষ সেন্টার','gyankosh','Pro',210,1500,'active'),
 (5,'দিগন্ত টিউটোরিয়াল','diganta','Basic',33,800,'suspended');

-- ---------- teachers ----------
INSERT INTO teachers (id, name, subject, phone, title, rating, rating_count, students_taught, bio) VALUES
 (1,'আবরার হায়দার','ফিজিক্স','01712-889900','সিনিয়র ফিজিক্স ইন্সট্রাক্টর',4.8,214,1240,'১০ বছরের বেশি সময় ধরে HSC ও ভর্তি পরীক্ষার শিক্ষার্থীদের পড়াচ্ছেন। জটিল ধারণা সহজ উদাহরণে বোঝানোই তাঁর বিশেষত্ব।'),
 (2,'সৌরভ বড়ুয়া','ফিজিক্স (সাপোর্ট)','01815-667788','সাপোর্ট ইন্সট্রাক্টর',4.6,88,430,'সাপোর্ট ক্লাস ও হোমওয়ার্ক রিভিউতে বিশেষজ্ঞ, শিক্ষার্থীদের দুর্বলতা ধরে ধরে ঠিক করেন।'),
 (3,'মেহজাবিন রহমান','গণিত','01911-223300','সিনিয়র গণিত ইন্সট্রাক্টর',4.7,132,760,'SSC উচ্চতর গণিতে দীর্ঘদিনের অভিজ্ঞ শিক্ষক। ধাপে ধাপে সমাধান শেখানোই তাঁর পদ্ধতি।');

INSERT INTO teacher_expertise (teacher_id, skill) VALUES
 (1,'বলবিদ্যা'),(1,'তড়িৎ ও চুম্বকত্ব'),(1,'আধুনিক পদার্থবিজ্ঞান'),
 (2,'সমস্যা সমাধান'),(2,'MCQ কৌশল'),
 (3,'বীজগণিত'),(3,'জ্যামিতি'),(3,'ত্রিকোণমিতি');

-- ---------- courses ----------
INSERT INTO courses (id,title,slug,published,category,mode,thumb,tagline,level,language,instructor,instructor_id,price,old_price,rating,rating_count,duration,description) VALUES
 (1,'HSC পদার্থবিজ্ঞান — সম্পূর্ণ কোর্স','hsc-physics',1,'physics','hybrid','ফিজিক্স','HSC পদার্থবিজ্ঞানের সম্পূর্ণ সিলেবাস — লাইভ ক্লাস, সাপ্তাহিক টেস্ট আর অ্যাসাইনমেন্টসহ।','HSC (একাদশ–দ্বাদশ)','বাংলা','আবরার হায়দার',1,1500,2500,4.8,214,'৪ মাস · ৪৮টি লাইভ ক্লাস','এই কোর্সে HSC পদার্থবিজ্ঞানের পুরো সিলেবাস ধাপে ধাপে কভার করা হবে। প্রতিটি অধ্যায়ে লাইভ ক্লাস, প্র্যাকটিস শিট, সাপ্তাহিক মডেল টেস্ট এবং ব্যক্তিগত ফিডব্যাক থাকবে। ক্লাস মিস করলে রেকর্ডিং দেখে নেওয়া যাবে।'),
 (2,'SSC উচ্চতর গণিত — লাইভ ব্যাচ','ssc-higher-math',0,'math','live','ম্যাথ','SSC উচ্চতর গণিতের প্রতিটি অধ্যায় সহজভাবে — লাইভ ক্লাস ও প্র্যাকটিসসহ।','SSC (নবম–দশম)','বাংলা','মেহজাবিন রহমান',3,1200,1800,4.6,96,'৩ মাস · ৩৬টি ক্লাস','SSC উচ্চতর গণিতের সেট, ফাংশন, বীজগণিত ও জ্যামিতি — প্রতিটি অধ্যায় লাইভ ক্লাসে বিস্তারিতভাবে শেখানো হবে।'),
 (3,'ফ্রি স্টার্টার — পড়াশোনার হাতেখড়ি','free-starter',1,'skills','recorded','ফ্রি','একদম বিনামূল্যে শুরু করুন — পড়াশোনার বেসিক কৌশল ও গাইডলাইন।','সকল শ্রেণি','বাংলা','Leo HQ',NULL,0,0,4.9,512,'২ সপ্তাহ · ৬টি লেসন','একটি সম্পূর্ণ বিনামূল্যের কোর্স যেখানে পড়াশোনার কার্যকর কৌশল, সময় ব্যবস্থাপনা ও পরীক্ষার প্রস্তুতির গাইডলাইন শেখানো হবে। এনরোল করলে অগ্রগতি ট্র্যাক হবে এবং সার্টিফিকেট পাওয়া যাবে।');

INSERT INTO course_learning_points (course_id, text) VALUES
 (1,'ভেক্টর, বলবিদ্যা ও গতিবিদ্যার শক্ত ভিত্তি'),(1,'বোর্ড ও ভর্তি পরীক্ষার সমস্যা সমাধানের কৌশল'),(1,'প্রতি অধ্যায়ে মডেল টেস্ট ও বিশ্লেষণ'),(1,'CQ ও MCQ — দুই ধরনের প্রশ্নেই দক্ষতা'),
 (2,'সেট ও ফাংশনের মৌলিক ধারণা'),(2,'বীজগণিতের সমস্যা সমাধান'),(2,'বোর্ড পরীক্ষার প্রস্তুতি'),
 (3,'কার্যকর পড়ার কৌশল'),(3,'সময় ব্যবস্থাপনা'),(3,'পরীক্ষার প্রস্তুতির পরিকল্পনা');

INSERT INTO course_requirements (course_id, text) VALUES
 (1,'একাদশ/দ্বাদশ শ্রেণির শিক্ষার্থী'),(1,'বেসিক গণিতের ধারণা'),(1,'স্মার্টফোন/কম্পিউটার ও ইন্টারনেট'),
 (2,'নবম/দশম শ্রেণির শিক্ষার্থী'),(2,'সাধারণ গণিতের ধারণা'),
 (3,'শেখার আগ্রহ'),(3,'স্মার্টফোন/কম্পিউটার');

INSERT INTO course_faqs (course_id, question, answer) VALUES
 (1,'ক্লাস মিস হলে কী হবে?','প্রতিটি ক্লাসের রেকর্ডিং পাওয়া যাবে, যেকোনো সময় দেখতে পারবেন।'),
 (1,'পেমেন্ট কীভাবে করব?','bKash/নগদ বা কার্ডের মাধ্যমে মাসিক ফি পরিশোধ করা যাবে।'),
 (1,'সার্টিফিকেট পাব?','কোর্স ৮০% সম্পন্ন করলে সার্টিফিকেট পাওয়া যাবে।'),
 (2,'ক্লাসের সময় কখন?','সপ্তাহে ৩ দিন সন্ধ্যায় লাইভ ক্লাস হবে।'),
 (2,'রেকর্ডিং পাব?','হ্যাঁ, প্রতিটি ক্লাসের রেকর্ডিং পাওয়া যাবে।'),
 (3,'এটা কি সত্যিই ফ্রি?','হ্যাঁ, সম্পূর্ণ বিনামূল্যে — কোনো পেমেন্ট লাগবে না। শুধু এনরোল করলেই হবে।');

INSERT INTO course_reviews (course_id, name, rating, text) VALUES
 (1,'সুমাইয়া ইসলাম',5,'ছোট গ্রুপে পড়ানোর কারণে প্রতিটা প্রশ্ন করার সুযোগ পেয়েছি।'),
 (1,'রাকিব হাসান',4,'রেকর্ডিং আর সাপোর্ট ক্লাস খুবই সহায়ক ছিল।'),
 (2,'নুসরাত জাহান',5,'গণিতের ভয় কেটে গেছে এই কোর্সে এসে।'),
 (3,'আরিফ হোসেন',5,'ফ্রি হলেও কনটেন্ট দারুণ। শুরুর জন্য পারফেক্ট।');

-- ---------- modules → lessons ----------
INSERT INTO modules (id, course_id, title, position) VALUES
 (11,1,'মডিউল ১: ভেক্টর ও স্কেলার',1),
 (12,1,'মডিউল ২: নিউটনীয় বলবিদ্যা',2),
 (21,2,'মডিউল ১: সেট ও ফাংশন',1),
 (31,3,'মডিউল ১: শুরুর গাইড',1);

INSERT INTO lessons (id, module_id, title, type, duration, is_free, position) VALUES
 (111,11,'ভেক্টর ও স্কেলারের ধারণা','video','৪২ মিনিট',1,1),
 (112,11,'ভেক্টর যোগ, বিয়োগ ও গুণন','video','৩৮ মিনিট',1,2),
 (113,11,'অধ্যায় ১ — শিট (PDF)','pdf',NULL,0,3),
 (114,11,'অধ্যায় ১ কুইজ','quiz',NULL,0,4),
 (115,11,'অ্যাসাইনমেন্ট ১.১ — ভেক্টর সমস্যা','assignment',NULL,0,5),
 (121,12,'গতির তিনটি সূত্র','video','৫০ মিনিট',0,1),
 (122,12,'ঘর্ষণ ও টান','video','৩৫ মিনিট',0,2),
 (123,12,'অ্যাসাইনমেন্ট ১ — বলবিদ্যা','assignment',NULL,0,3),
 (211,21,'সেটের ধারণা','video','৪০ মিনিট',1,1),
 (212,21,'ফাংশন ও তার প্রকারভেদ','video','৪৫ মিনিট',0,2),
 (311,31,'কীভাবে পড়লে মনে থাকে','video','১৮ মিনিট',1,1),
 (312,31,'রুটিন তৈরির সহজ নিয়ম','video','২২ মিনিট',1,2);

-- ---------- batches + teacher assignments ----------
INSERT INTO batches (id, name, course_id, students_count, fee, schedule) VALUES
 (1,'HSC ফিজিক্স — ব্যাচ ৩',1,32,'1,500','শনি-সোম-বুধ · সন্ধ্যা ৭টা'),
 (2,'SSC গণিত — সকাল',2,24,'1,200','রবি-মঙ্গল · সকাল ১০টা'),
 (3,'ফ্রি স্টার্টার — ওপেন',3,512,'0','সেল্ফ-পেসড · যেকোনো সময়');

INSERT INTO teacher_batches (teacher_id, batch_id) VALUES (1,1),(2,1),(3,2);

-- ---------- students (batch_id resolved from the batch name) ----------
INSERT INTO students (id, name, phone, batch_id, amount, paid) VALUES
 (1,'তানভীর আহমেদ','01712-334455',1,1500,0),
 (2,'সুমাইয়া ইসলাম','01818-990011',1,1500,1),
 (3,'রাকিব হাসান','01917-556677',2,1200,0),
 (4,'নুসরাত জাহান','01611-223344',2,1200,1),
 (5,'মেহেদী হাসান','01715-887799',1,1500,1);

-- ---------- enrollments ----------
INSERT INTO enrollments (id, student_id, batch_id, course_id, enrolled_at, status) VALUES
 (1,1,1,1,'2026-06-01','active'),
 (2,2,1,1,'2026-06-01','active'),
 (3,5,1,1,'2026-06-03','active');

-- ---------- submissions ----------
INSERT INTO submissions (id, lesson_id, course_id, student_id, student_name, content, submitted_at, status, marks, max_marks, feedback) VALUES
 (1,123,1,1,'তানভীর আহমেদ','বলবিদ্যার সমস্যাগুলোর সমাধান সংযুক্ত করা হলো।','2026-07-02','graded',18,20,'চমৎকার! ঘর্ষণ অংশে আরও যত্নবান হও।'),
 (2,123,1,2,'সুমাইয়া ইসলাম','সমাধান জমা দিলাম।','2026-07-04','submitted',NULL,20,NULL);

-- ---------- attendance ----------
INSERT INTO attendance (id, student_id, batch_id, class_date, title, present) VALUES
 (1,1,1,'2026-07-02','লাইভ ক্লাস — কাজ, শক্তি ও ক্ষমতা',1),
 (2,1,1,'2026-06-30','সাপোর্ট ক্লাস — মডিউল ৮',1),
 (3,1,1,'2026-06-29','লাইভ ক্লাস — ভেক্টর রিভিশন',0),
 (4,1,1,'2026-06-27','লাইভ ক্লাস — নিউটনের সূত্র',1),
 (5,1,1,'2026-06-25','মডেল টেস্ট ৭',1),
 (6,1,1,'2026-06-22','লাইভ ক্লাস — মহাকর্ষ ও অভিকর্ষ',1),
 (7,2,1,'2026-07-02','লাইভ ক্লাস — কাজ, শক্তি ও ক্ষমতা',1),
 (8,5,1,'2026-07-02','লাইভ ক্লাস — কাজ, শক্তি ও ক্ষমতা',0);

-- ---------- jobs + skills + applications ----------
INSERT INTO jobs (id, title, company, location, type, salary, posted_at, is_open) VALUES
 (1,'জুনিয়র ফিজিক্স টিউটর','আলোর পথ কোচিং','ঢাকা','full-time','২৫,০০০','2026-07-01',1),
 (2,'কন্টেন্ট রাইটার (গণিত)','মেধা একাডেমি','রিমোট','part-time','১৫,০০০','2026-06-28',1),
 (3,'ল্যাব অ্যাসিস্ট্যান্ট','জ্ঞানকোষ সেন্টার','চট্টগ্রাম','internship','১০,০০০','2026-06-20',0);

INSERT INTO job_skills (job_id, skill) VALUES
 (1,'ফিজিক্স'),(1,'HSC'),(2,'গণিত'),(2,'লেখালেখি'),(3,'কেমিস্ট্রি');

INSERT INTO applications (id, job_id, student_id, student_name, status, applied_at) VALUES
 (1,1,1,'তানভীর আহমেদ','shortlisted','2026-07-02');

-- ---------- live classes ----------
INSERT INTO live_classes (id, course_id, batch_id, instructor_id, title, class_date, start_time, end_time, zoom_url, status, recording_url) VALUES
 (1,1,1,1,'নিউটনিয়ান বলবিদ্যা — কাজ, শক্তি ও ক্ষমতা','2026-07-06','সন্ধ্যা ৭:০০','রাত ৯:০০','https://zoom.us/j/1112223334','live',NULL),
 (2,1,1,1,'পর্যাবৃত্ত গতি — সরল ছন্দিত স্পন্দন','2026-07-08','সন্ধ্যা ৭:০০','রাত ৯:০০','https://zoom.us/j/2223334445','scheduled',NULL),
 (3,1,1,1,'ভেক্টর রিভিশন ক্লাস','2026-06-29','সন্ধ্যা ৭:০০','রাত ৯:০০','https://zoom.us/j/3334445556','ended','https://recordings.leolearning.app/vec-rev');

-- ---------- payments ----------
INSERT INTO payments (id, student_id, student_name, course_id, batch_id, amount, method, type, status, trx_id, invoice_no, created_at) VALUES
 (1,1,'তানভীর আহমেদ',1,1,1500,'bkash','enrollment','success','TRX9GK4A2LX','INV-2026-0001','2026-06-01'),
 (2,2,'সুমাইয়া ইসলাম',1,1,1500,'bkash','fee','success','TRX7HL2B93K','INV-2026-0002','2026-06-05');

-- certificates: none seeded (earned live in the app demo)

SET FOREIGN_KEY_CHECKS = 1;
-- Done. Seed data loaded.

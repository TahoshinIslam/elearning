// Course statistics, badges, offer pricing, reviews and campaigns — real DB,
// real bKash adapter via the in-process simulator.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { q } from '@/lib/mysql';
import { installBkashSimulator, customer, paymentIdFrom } from './helpers/bkashSim.mjs';
import { fixtures } from './helpers/fixtures.mjs';
import { createOrder, finalizeBkashCallback, priceCourses, refundOrder } from '@/lib/orderRepo';
import { listPublishedCourses, getPublicCourse, catalogContext } from '@/lib/catalogRepo';
import { submitReview, reviewEligibility } from '@/lib/reviewRepo';
import { courseOp } from '@/lib/repo';
import { getActiveCampaigns, saveCampaign, campaignAction } from '@/lib/campaignRepo';
import { badgesFor } from '@/lib/badges';

const fx = fixtures('stats');
let sim, course, freeCourse, buyerA, buyerB, pendingBuyer, refundBuyer, freeLearner, outsider, offerId;
const owner = { id: null, role: 'owner' };

async function buy(s, courseId, action = 'pay') {
  const created = await createOrder(s.session, { courseId });
  if (!created.bkashURL) return created.order;
  if (action === 'none') return created.order;
  return (await finalizeBkashCallback(customer(paymentIdFrom(created.bkashURL), action))).order;
}
const cardFor = async (id) => (await listPublishedCourses({ sort: 'relevance', page: 1 }, { pageSize: 200 })).items.find((c) => c.id === id);

beforeAll(async () => {
  sim = installBkashSimulator();
  course = await fx.course({ price: 1000 });
  freeCourse = await fx.course({ price: 0 });
  [buyerA, buyerB, pendingBuyer, refundBuyer, freeLearner, outsider] = await Promise.all(['A', 'B', 'Pending', 'Refund', 'Free', 'Out'].map((n) => fx.student(n)));
});

afterAll(async () => {
  sim.restore();
  await q('DELETE FROM campaigns WHERE slug LIKE ?', [`stats-${fx.RUN}%`]);
  if (offerId) await q('DELETE FROM offers WHERE id = ?', [offerId]);
  await fx.cleanup();
});

describe('purchase counts come only from verified purchases', () => {
  it('counts unique paid purchasers; excludes pending, refunded, and free enrollments', async () => {
    await buy(buyerA, course.courseId);
    await buy(buyerB, course.courseId);
    await buy(pendingBuyer, course.courseId, 'none');           // never paid
    const refunded = await buy(refundBuyer, course.courseId);
    await refundOrder({ id: null, role: 'owner' }, refunded.id); // refunded → revoked
    await createOrder(freeLearner.session, { courseId: freeCourse.courseId });

    const card = await cardFor(course.courseId);
    expect(card.purchaseCount).toBe(2);
    const free = await cardFor(freeCourse.courseId);
    expect(free.purchaseCount).toBe(0);
    expect(free.enrollmentCount).toBe(1);
  });
});

describe('reviews', () => {
  it('only verified purchasers (or free-course enrollees) may review; one editable review each', async () => {
    expect((await reviewEligibility(outsider.studentId, course.courseId)).eligible).toBe(false);
    expect((await reviewEligibility(pendingBuyer.studentId, course.courseId)).eligible).toBe(false);
    expect((await reviewEligibility(refundBuyer.studentId, course.courseId)).eligible).toBe(false);
    await expect(submitReview({ ...outsider.session }, { courseId: course.courseId, rating: 5 })).rejects.toMatchObject({ status: 403 });

    const first = await submitReview(buyerA.session, { courseId: course.courseId, rating: 3, text: '' });
    expect(first).toMatchObject({ rating: 3, status: 'pending', verifiedPurchase: true });
    const edited = await submitReview(buyerA.session, { courseId: course.courseId, rating: 5, text: 'চমৎকার কোর্স' });
    expect(edited.rating).toBe(5);
    const [{ n }] = await q('SELECT COUNT(*) AS n FROM course_reviews WHERE course_id = ? AND student_id = ?', [course.courseId, buyerA.studentId]);
    expect(n).toBe(1);
    expect((await reviewEligibility(freeLearner.studentId, freeCourse.courseId)).eligible).toBe(true);
  });

  it('ratings count only published (approved) reviews; none → null', async () => {
    let card = await cardFor(course.courseId);
    expect(card.rating).toBeNull();          // still pending moderation
    expect(card.reviewCount).toBe(0);
    await submitReview(buyerB.session, { courseId: course.courseId, rating: 4 });
    await q("UPDATE course_reviews SET status = 'approved' WHERE course_id = ?", [course.courseId]);
    card = await cardFor(course.courseId);
    expect(card.reviewCount).toBe(2);
    expect(card.rating).toBe(4.5);
    const page = await getPublicCourse(course.slug);
    expect(page.reviews.every((r) => r.verifiedPurchase)).toBe(true);
  });
});

describe('badges', () => {
  const rules = { topRatedMin: 4.5, topRatedReviews: 10, newDays: 30 };
  it('Top Rated needs both the average and enough verified reviews', () => {
    expect(badgesFor({ published: 1, verified_avg: 4.9, verified_review_count: 9 }, rules)).not.toContain('top_rated');
    expect(badgesFor({ published: 1, verified_avg: 4.5, verified_review_count: 10 }, rules)).toContain('top_rated');
    expect(badgesFor({ published: 1, verified_avg: 4.4, verified_review_count: 40 }, rules)).not.toContain('top_rated');
  });
  it('New follows the FIRST publication; republishing does not reset it', async () => {
    const c = await fx.course({ published: false });
    await courseOp({ op: 'publish', courseId: c.courseId }, owner);
    const [{ first_published_at: first }] = await q('SELECT first_published_at FROM courses WHERE id = ?', [c.courseId]);
    expect(first).toBeTruthy();
    expect((await cardFor(c.courseId)).badges).toContain('new');
    await q('UPDATE courses SET first_published_at = NOW() - INTERVAL 90 DAY WHERE id = ?', [c.courseId]);
    await courseOp({ op: 'publish', courseId: c.courseId }, owner); // unpublish
    await courseOp({ op: 'publish', courseId: c.courseId }, owner); // republish
    expect((await cardFor(c.courseId)).badges).not.toContain('new');
  });
  it('Upcoming courses are announcements only: no lessons exposed, not purchasable', async () => {
    const c = await fx.course({ published: false, lessons: [{ free: true }] });
    await q("UPDATE courses SET tagline = 'Coming soon' WHERE id = ?", [c.courseId]);
    await courseOp({ op: 'setUpcoming', courseId: c.courseId, isUpcoming: true, releaseDate: '2027-01-15' }, owner);
    const page = await getPublicCourse(c.slug);
    expect(page.upcoming).toBe(true);
    expect(page.badges).toEqual(['upcoming']);
    expect(page.modules).toEqual([]);
    expect(page.previewLessons).toEqual([]);
    await expect(priceCourses(outsider.session, [c.courseId])).rejects.toMatchObject({ body: { error: 'course_not_available' } });
  });
});

describe('offers: advertised price = course page price = checkout total = charged amount', () => {
  it('applies the best live offer everywhere and snapshots it on the order', async () => {
    const c = await fx.course({ price: 2000 });
    const res = await q("INSERT INTO offers (name, type, value, scope, scope_value, starts_at, ends_at, is_active) VALUES (?, 'percent', 25, 'course', ?, NOW() - INTERVAL 1 HOUR, NOW() + INTERVAL 1 DAY, 1)",
      [`Test offer ${fx.RUN}`, String(c.courseId)]);
    offerId = res.insertId;
    const card = await cardFor(c.courseId);
    expect(card).toMatchObject({ listPrice: 2000, price: 1500 });
    expect((await getPublicCourse(c.slug)).price).toBe(1500);
    const quote = await priceCourses(outsider.session, [c.courseId]);
    expect(quote).toMatchObject({ subtotal: 2000, offerDiscount: 500, amount: 1500 });
    const created = await createOrder(outsider.session, { courseId: c.courseId });
    expect(created.order.amount).toBe(1500);
    const [item] = await q('SELECT unit_price, list_price, offer_id FROM order_items WHERE order_id = ?', [created.order.id]);
    expect(item).toMatchObject({ unit_price: 1500, list_price: 2000, offer_id: offerId });
    const paid = await finalizeBkashCallback(customer(paymentIdFrom(created.bkashURL), 'pay'));
    expect(paid.order.status).toBe('paid');
  });

  it('expired offers stop applying, and campaigns tied to them disappear', async () => {
    const c = await fx.course({ price: 800 });
    const [{ slug }] = await q('SELECT slug FROM courses WHERE id = ?', [c.courseId]);
    await q('UPDATE offers SET scope_value = ?, ends_at = NOW() + INTERVAL 1 DAY WHERE id = ?', [String(c.courseId), offerId]);
    await saveCampaign(owner, { kind: 'slide', slug: `stats-${fx.RUN}`, title: 'Offer slide', ctaLabel: 'দেখুন', targetType: 'course', targetValue: slug, offerId, pages: ['home'] });
    const [camp] = await q('SELECT id FROM campaigns WHERE slug = ?', [`stats-${fx.RUN}`]);
    await campaignAction(owner, { id: camp.id, action: 'publish' });
    let live = await getActiveCampaigns({ kind: 'slide', page: 'home', session: null });
    const mine = live.find((x) => x.id === camp.id);
    expect(mine.href).toBe(`/course/${slug}`);
    expect(mine.offer).toMatchObject({ type: 'percent', value: 25 });

    await q('UPDATE offers SET ends_at = NOW() - INTERVAL 1 MINUTE WHERE id = ?', [offerId]);
    expect((await cardFor(c.courseId)).price).toBe(800);
    live = await getActiveCampaigns({ kind: 'slide', page: 'home', session: null });
    expect(live.find((x) => x.id === camp.id)).toBeUndefined();
    const ctx = await catalogContext();
    expect(ctx.offers.find((o) => o.id === offerId)).toBeUndefined();
  });

  it('campaign targets must resolve to real destinations', async () => {
    await expect(saveCampaign(owner, { kind: 'popup', title: 'x', ctaLabel: 'y', targetType: 'course', targetValue: 'no-such-course' }))
      .rejects.toMatchObject({ status: 400, body: { error: 'target_not_found' } });
  });
});

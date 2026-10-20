// Admin taxonomy, settings validation, catalog "other" class filter and the
// dashboard overview — real DB.
import { describe, it, expect, afterAll } from 'vitest';
import { q } from '@/lib/mysql';
import { fixtures } from './helpers/fixtures.mjs';
import { createCategory, updateCategory, deleteCategory, getCategories } from '@/lib/categoryRepo';
import { createClassLevel, updateClassLevel, deleteClassLevel } from '@/lib/taxonomyRepo';
import { saveSettings, getSettings } from '@/lib/settingsRepo';
import { listPublishedCourses } from '@/lib/catalogRepo';
import { getAdminOverview } from '@/lib/adminOverview';

const fx = fixtures('tax');
const catSlug = `tax-${fx.RUN}`.toLowerCase();
const classSlug = `cls-${fx.RUN}`.toLowerCase();

afterAll(async () => {
  await q('DELETE FROM categories WHERE slug LIKE ?', [`${catSlug}%`]);
  await q('DELETE FROM class_levels WHERE slug LIKE ?', [`${classSlug}%`]);
  await fx.cleanup();
});

describe('subjects', () => {
  it('orders, renames and refuses to delete a subject still used by courses', async () => {
    let list = await createCategory({ name: 'Test subject', slug: catSlug });
    const cat = list.find((x) => x.slug === catSlug);
    expect(cat).toMatchObject({ courseCount: 0 });
    list = await updateCategory({ id: cat.id, name: 'Renamed subject' });
    expect(list.find((x) => x.id === cat.id).name).toBe('Renamed subject');
    const before = list.findIndex((x) => x.id === cat.id);
    list = await updateCategory({ id: cat.id, dir: 'up' });
    if (before > 0) expect(list.findIndex((x) => x.id === cat.id)).toBe(before - 1);

    const course = await fx.course();
    await q('UPDATE courses SET category = ? WHERE id = ?', [catSlug, course.courseId]);
    expect((await getCategories()).find((x) => x.id === cat.id).courseCount).toBe(1);
    await expect(deleteCategory({ id: cat.id })).rejects.toMatchObject({ status: 409, body: { error: 'category_in_use' } });
    await q('UPDATE courses SET category = NULL WHERE id = ?', [course.courseId]);
    expect((await deleteCategory({ id: cat.id })).find((x) => x.id === cat.id)).toBeUndefined();
  });
});

describe('classes and the catalog', () => {
  it('filters by class, and class=other finds courses without one', async () => {
    const list = await createClassLevel({ name: 'Test class', slug: classSlug });
    const cl = list.find((x) => x.slug === classSlug);
    const inClass = await fx.course();
    const noClass = await fx.course();
    await q('UPDATE courses SET class_id = ? WHERE id = ?', [cl.id, inClass.courseId]);
    const byClass = (await listPublishedCourses({ class: classSlug, sort: 'relevance', page: 1 }, { pageSize: 200 })).items.map((c) => c.id);
    expect(byClass).toEqual([inClass.courseId]);
    const other = (await listPublishedCourses({ class: 'other', sort: 'relevance', page: 1 }, { pageSize: 200 })).items.map((c) => c.id);
    expect(other).toContain(noClass.courseId);
    expect(other).not.toContain(inClass.courseId);
    await updateClassLevel({ id: cl.id, name: 'Renamed class' });
    await deleteClassLevel({ id: cl.id });
    const [{ class_id: after }] = await q('SELECT class_id FROM courses WHERE id = ?', [inClass.courseId]);
    expect(after).toBeNull(); // course kept, class detached
  });
});

describe('settings', () => {
  it('rejects out-of-range badge rules without storing anything', async () => {
    const before = await getSettings();
    await expect(saveSettings({ badgeTopRatedMin: '9', siteTitle: 'should not save' })).rejects.toMatchObject({ status: 400, body: { error: 'invalid_setting' } });
    expect((await getSettings()).siteTitle).toBe(before.siteTitle);
  });
});

describe('admin overview', () => {
  it('returns real counts only', async () => {
    // Other test files insert rows concurrently, so bound by before/after counts.
    const count = async () => {
      const [[{ n }], [{ p }]] = await Promise.all([q('SELECT COUNT(*) AS n FROM students'), q('SELECT COUNT(*) AS p FROM courses WHERE published = 1')]);
      return { n: Number(n), p: Number(p) };
    };
    const before = await count();
    const o = await getAdminOverview();
    const after = await count();
    const within = (v, a, b) => v >= Math.min(a, b) && v <= Math.max(a, b);
    expect(within(o.students.total, before.n, after.n)).toBe(true);
    expect(within(o.courses.published, before.p, after.p)).toBe(true);
  });
});

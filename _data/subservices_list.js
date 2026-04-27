const { directusFetch, downloadImg } = require('../lib/directus');

const SITE_ID = process.env.SITE_ID || 'broklands';

function extractMinPrice(rows) {
  if (!rows || !rows.length) return '';
  let min = Infinity;
  for (const r of rows) {
    const num = parseInt((r.price || '').replace(/[^\d]/g, ''), 10);
    if (!isNaN(num) && num < min) min = num;
  }
  if (!isFinite(min)) return '';
  return min.toLocaleString('ru-RU') + ' ₽';
}

module.exports = async function () {
  try {
    const { data: subs } = await directusFetch(
      `/items/subservices?sort=sort&filter[site_id][_eq]=${SITE_ID}&fields=*,parent_service.slug,parent_service.title,price_rows.name,price_rows.price,price_rows.sort,faq_items.question,faq_items.answer,faq_items.sort,content_blocks.heading,content_blocks.text,content_blocks.sort`
    );

    const parentCounts = {};
    subs.forEach(s => {
      const p = s.parent_service?.slug;
      if (p) parentCounts[p] = (parentCounts[p] || 0) + 1;
    });

    return Promise.all(subs.map(async s => ({
      slug:       s.slug        || '',
      parent:     s.parent_service?.slug  || '',
      parentName: s.parent_service?.title || '',
      isOnlySub:  parentCounts[s.parent_service?.slug] === 1,
      title:      s.title       || '',
      desc:       s.description || '',
      img:        await downloadImg(s.hero_image,        '/images/hero-1.jpg', 'width=1920&quality=85'),
      imgMobile:  await downloadImg(s.hero_image_mobile, '', 'width=768&quality=80') || await downloadImg(s.hero_image, '/images/hero-1.jpg', 'width=768&quality=80'),
      descShort:  (s.description || '').split(/[.!?]/)[0].trim(),
      minPrice:   extractMinPrice(s.price_rows),
      tableTitle: s.table_title || '',
      rows: (s.price_rows || [])
        .sort((a, b) => (a.sort || 0) - (b.sort || 0))
        .map(r => ({ name: r.name || '', price: r.price || '' })),
      faq: (s.faq_items || [])
        .sort((a, b) => (a.sort || 0) - (b.sort || 0))
        .map(f => ({ q: f.question || '', a: f.answer || '' })),
      descBlocks: (s.content_blocks || [])
        .sort((a, b) => (a.sort || 0) - (b.sort || 0))
        .map(b => ({ h2: b.heading || '', text: b.text || '' })),
    })));
  } catch (err) {
    console.error('[subservices_list.js] Directus fetch failed:', err.message);
    return [];
  }
};

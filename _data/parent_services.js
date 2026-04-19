const { directusFetch, downloadImg } = require('../lib/directus');

module.exports = async function () {
  try {
    const { data: services } = await directusFetch(
      '/items/services?sort=sort&fields=*,subservices.slug,subservices.title,subservices.description,price_rows.name,price_rows.price,price_rows.sort,faq_items.question,faq_items.answer,faq_items.sort,content_blocks.heading,content_blocks.text,content_blocks.sort'
    );

    return Promise.all(services.map(async s => ({
      slug:       s.slug        || '',
      title:      s.title       || '',
      desc:       s.description || '',
      img:        await downloadImg(s.hero_image,        '/images/hero-1.jpg', 'width=1920&quality=85'),
      imgMobile:  await downloadImg(s.hero_image_mobile, '', 'width=768&quality=80') || await downloadImg(s.hero_image, '/images/hero-1.jpg', 'width=768&quality=80'),
      tableTitle: s.table_title || '',
      subservices: (s.subservices || []).map(sub => ({
        name: sub.title       || '',
        slug: sub.slug        || '',
        desc: sub.description || '',
      })),
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
    console.error('[parent_services.js] Directus fetch failed:', err.message);
    return [];
  }
};

const { directusFetch, downloadImg } = require('../lib/directus');

const SITE_ID = process.env.SITE_ID || 'broklands';
const F = `filter[site_id][_eq]=${SITE_ID}`;

module.exports = async function () {
  try {
    const slides    = await directusFetch(`/items/hero_slides?sort=sort&${F}&filter[page][_null]=true&fields=*`);
    const worksHeroRes = await directusFetch(`/items/hero_slides?${F}&filter[page][_eq]=nashi-raboty&limit=1&fields=*`);
    const stats     = await directusFetch(`/items/stats?sort=sort&${F}&fields=*`);
    const services  = await directusFetch(`/items/services?sort=sort&${F}&fields=id,slug,title,image`);
    const reviews   = await directusFetch(`/items/reviews?sort=sort&${F}&fields=*`);
    const advantages= await directusFetch(`/items/advantages?sort=sort&${F}&fields=*`);
    const works     = await directusFetch(`/items/works?sort=sort&${F}&fields=*`);

    const heroSlides = await Promise.all((slides.data || []).map(async (s, i) => ({
      title:       s.title    || '',
      subtitle:    s.subtitle || '',
      bg:          await downloadImg(s.image,        `/images/hero-${i + 1}.jpg`, 'width=1920&quality=85'),
      bgMobile:    await downloadImg(s.image_mobile, `/images/hero-${i + 1}.jpg`, 'width=768&quality=80'),
      video:       await downloadImg(s.video,        ''),
      videoMobile: await downloadImg(s.video_mobile, ''),
    })));

    const serviceCards = await Promise.all((services.data || []).map(async (s, i) => ({
      name: s.title || '',
      slug: s.slug  || '',
      img:  await downloadImg(s.image, `/images/service-${i}.jpg`, 'width=800&quality=80'),
    })));

    const workImgs = await Promise.all((works.data || []).map((w, i) =>
      downloadImg(w.image, `/images/work-${i + 1}.jpg`, 'width=800&quality=80')
    ));

    const servicesMap = serviceCards.reduce((acc, s) => { acc[s.slug] = s; return acc; }, {});

    const worksHeroRaw = (worksHeroRes.data || [])[0];
    const worksHero = worksHeroRaw ? {
      title:    worksHeroRaw.title    || '',
      subtitle: worksHeroRaw.subtitle || '',
      bg:       await downloadImg(worksHeroRaw.image,        '/images/cta-bg.jpg', 'width=1920&quality=85'),
      bgMobile: await downloadImg(worksHeroRaw.image_mobile, '', 'width=768&quality=80'),
    } : null;

    return {
      hero: { slides: heroSlides },
      stats: (stats.data || []).map(s => ({ value: s.value || '', label: s.label || '' })),
      services: serviceCards,
      servicesMap,
      reviews: (reviews.data || []).map(r => ({
        name:   r.name           || '',
        text:   r.text           || '',
        rating: r.rating         || 5,
        source: r.source         || 'yandex',
        avatar: r.avatar_initial || '',
      })),
      advantagesDesc: (advantages.data || []).map(a => a.section_desc).find(Boolean) || '',
      advantages: (advantages.data || []).filter(a => a.icon).map(a => ({
        title: a.title       || '',
        desc:  a.description || '',
        icon:  a.icon        || '',
      })),
      works: workImgs,
      worksHero,
      worksHeroBg: '/images/hero-1.jpg',
    };
  } catch (err) {
    console.error('[pagedata.js] Directus fetch failed:', err.message);
    return {
      hero: { slides: [] }, stats: [], services: [], reviews: [],
      advantages: [], works: [], worksHero: null, worksHeroBg: '/images/hero-1.jpg',
    };
  }
};

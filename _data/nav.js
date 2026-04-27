const { directusFetch } = require('../lib/directus');

const SITE_ID = process.env.SITE_ID || 'broklands';

module.exports = async function () {
  try {
    const { data: services } = await directusFetch(
      `/items/services?sort=sort&filter[site_id][_eq]=${SITE_ID}&fields=slug,title,subservices.slug,subservices.title`
    );

    return {
      services: services.map(s => {
        const subs = (s.subservices || []).map(sub => ({
          name: sub.title || '',
          slug: sub.slug  || '',
        }));
        return {
          name: s.title || '',
          slug: s.slug  || '',
          directSlug: s.slug || '',
          subservices: subs,
        };
      }),
      company: [
        { name: 'Наши работы', slug: 'nashi-raboty' },
        { name: 'Контакты',    slug: 'kontakty' },
      ],
    };
  } catch (err) {
    console.error('[nav.js] Directus fetch failed:', err.message);
    return { services: [], company: [
      { name: 'Наши работы', slug: 'nashi-raboty' },
      { name: 'Контакты',    slug: 'kontakty' },
    ]};
  }
};

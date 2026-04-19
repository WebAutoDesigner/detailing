const { directusFetch } = require('../lib/directus');

module.exports = async function () {
  try {
    const { data: services } = await directusFetch(
      '/items/services?sort=sort&fields=slug,title,subservices.slug,subservices.title'
    );

    return {
      services: services.map(s => ({
        name: s.title || '',
        slug: s.slug  || '',
        subservices: (s.subservices || []).map(sub => ({
          name: sub.title || '',
          slug: sub.slug  || '',
        })),
      })),
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

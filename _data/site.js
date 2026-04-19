const { directusFetch, downloadImg } = require('../lib/directus');

module.exports = async function () {
  try {
    const siteRes    = await directusFetch('/items/site_settings');
    const socialsRes = await directusFetch('/items/social_links?sort=sort&fields=platform,label,url');

    const d = siteRes.data;
    if (!d || typeof d !== 'object' || Array.isArray(d)) {
      throw new Error('site_settings returned unexpected data shape — check Directus singleton config');
    }

    const socials  = Array.isArray(socialsRes.data) ? socialsRes.data : [];
    const siteUrl  = (process.env.SITE_URL || '').replace(/\/$/, '');
    const vkLink   = socials.find(s => s.platform === 'vk');
    const tgLink   = socials.find(s => s.platform === 'telegram');

    const phone    = d.phone || '';
    const phoneHref = d.phone_href || (phone ? 'tel:' + phone.replace(/\D/g, '') : '');

    return {
      name:            d.name              || '',
      tagline:         d.tagline           || '',
      phone,
      phoneHref,
      city:            d.city              || '',
      address:         d.address           || '',
      yandexMapsEmbed: d.yandex_maps_embed || '',
      workHours:       d.work_hours        || '',
      workHoursShort:  d.work_hours_short  || '',
      telegramBot:     d.telegram_bot_url  || '',
      email:           d.email             || '',
      vk:              vkLink?.url         || '',
      telegram:        tgLink?.url         || '',
      siteUrl,
      ctaBg:           await downloadImg(d.cta_background, '/images/cta-bg.jpg'),
      socials,
    };
  } catch (err) {
    console.error('[site.js] Directus fetch failed:', err.message);
    return {
      name: '', tagline: '', phone: '', phoneHref: '', city: '',
      address: '', yandexMapsEmbed: '', workHours: '', workHoursShort: '',
      telegramBot: '', email: '', vk: '', telegram: '',
      siteUrl: (process.env.SITE_URL || '').replace(/\/$/, ''),
      ctaBg: '/images/cta-bg.jpg',
      socials: [],
    };
  }
};

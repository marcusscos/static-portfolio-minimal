// Google Analytics 4 (GA4) — Contagem de Visitantes Únicos por IP
// Copiar do: https://analytics.google.com/analytics/web/provision/#/provision/create
(function() {
  // Substitua 'G-SEU_ID_AQUI' pelo seu Measurement ID (ex: G-XXXXXXXX)
  var GA4_ID = 'G-XE89MXTEXS';

  if (!GA4_ID) return;

  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', GA4_ID);
})();
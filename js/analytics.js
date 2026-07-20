// Google Analytics 4 (GA4) — Contagem de Visitantes Únicos por IP + Eventos Personalizados + User Properties
// Copiar do: https://analytics.google.com/analytics/web/provision/#/provision/create

(function() {
  // Substitua 'G-SEU_ID_AQUI' pelo seu Measurement ID (ex: G-XXXXXXXX)
  var GA4_ID = 'G-XE89MXTEXS';

  if (!GA4_ID) return;

  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}

  // ========================================================================
  // CONFIGURAÇÃO INICIAL DO GA4
  // ========================================================================
  gtag('js', new Date());

  gtag('config', GA4_ID, {
    // Habilitar Enhanced Measurement (captura automático de scroll, cliques, teclas)
    enhanced_measurement_consent: {
      use_default_only: true,
      default_value: 'granted' // Mude para 'denied' se preferir bloquear
    },

    // Definir eventos personalizados como conversões (ações importantes do site)
    events: ['page_view', 'scroll'],

    // User Properties — dados persistentes sobre o usuário
    user_properties: {
      subscription_status: 'free' // ou 'premium', 'trial'
    }
  });

  // ========================================================================
  // EVENTOS PERSONALIZADOS
  // ========================================================================

  /**
   * Dispara evento quando um botão é clicado
   */
  document.addEventListener('click', function(e) {
    var target = e.target.closest('[data-analytics-event]');
    if (target && target.dataset.analyticsEvent) {
      gtag('event', target.dataset.analyticsEvent, {
        event_category: 'engagement',
        button_id: target.id || target.dataset.analyticsEvent,
        content_type: 'button'
      });

      // Exemplo de mapeamento de eventos por ID
      var eventName = target.dataset.analyticsEvent;
      switch(eventName) {
        case 'subscribe':
          gtag('event', 'sign_up');
          break;
        case 'contact_form_submit':
          gtag('event', 'lead_generation', { content_name: 'form' });
          break;
        case 'share_link':
          gtag('event', 'social_share', { social_network: 'linkedin' });
          break;
      }
    }
  });

  /**
   * Dispara evento quando o usuário rola a página até 70% do final
   */
  window.addEventListener('scroll', function() {
    if (window.scrollY > document.body.scrollHeight * 0.7) {
      gtag('event', 'page_scrolled_to_bottom');
    }
  });

  /**
   * Dispara evento ao carregar imagem
   */
  var images = document.querySelectorAll('img[data-analytics-event="image_load"]');
  if (images.length > 0) {
    images.forEach(function(img) {
      img.addEventListener('load', function() {
        gtag('event', 'image_viewed', { image_url: this.src });
      });
    });
  }

  /**
   * Dispara evento quando o usuário envia formulário
   */
  document.querySelectorAll('form[data-analytics-event="form_submit"]').forEach(function(form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault(); // Previne envio real para demonstração
      gtag('event', 'form_submission', { content_name: 'contact_form' });

      var formData = new FormData(this);
      var data = {};
      formData.forEach(function(value, key) { data[key] = value; });
      gtag('event', 'form_submission', data);
    });
  });

 
  // ========================================================================
  // USER PROPERTIES — Dados Persistentes do Usuário
  // ========================================================================

  /**
   * Atualiza User Properties com base no contexto do usuário
   */
  function updateUserProperties(context) {
    var properties = {
      subscription_status: context.subscription || 'free',
      plan_tier: context.plan || 'basic'
    };

    if (context.referral_source) {
      properties.referral_source = context.referral_source;
    }

    if (context.device_type) {
      properties.device_type = context.device_type;
    }

    gtag('set', 'user_properties', properties);
  }

  // ========================================================================
  // INICIALIZAÇÃO COMPORTAMENTAL
  // ========================================================================

  /**
   * Inicia tracking de page_view ao carregar a página
   */
  function initPageTracking() {
    gtag('event', 'page_view', {
      page_location: window.location.href,
      page_path: window.location.pathname,
      page_title: document.title
    });

    // Detectar tipo de dispositivo para user properties
    var isMobile = /Android|webOS|iPhone|iPod|iPad|BlackBerry|Windows Phone/i.test(navigator.userAgent);
    updateUserProperties({ device_type: isMobile ? 'mobile' : 'desktop' });
  }

  /**
   * Inicia tracking de links clicados
   */
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a[href]');
    if (link && link.hostname !== window.location.hostname) {
      gtag('event', 'click_external_link', { url: link.href });
    }
  });

  // ========================================================================
  // EXPORTAR FUNÇÕES PARA USO NO DOM
  // ========================================================================
  window.updateUserProperties = updateUserProperties;
  window.initGA4 = initPageTracking;

  /**
   * Função de conversão global (adicionada para compatibilidade)
   */
  window.trackConversion = function(conversionName, conversionValue) {
    gtag('event', conversionName || 'conversion', { value: conversionValue || 0 });
  };

  // Inicializar no carregamento da página
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initPageTracking();
    });
  } else {
    initPageTracking();
  }

})();

/* main.js - robust single shared script for all pages
   This is the production script with a small resilience layer:
   - ensures required DOM anchors exist (creates them if missing)
   - then fetches copy from /copy/*.json and populates the page
   - handles Calendly embed, language toggle and payment placeholder
*/

(async function(){
  // tiny helper utilities
  function by(id){ return document.getElementById(id); }
  function q(sel){ return document.querySelector(sel); }

  // Ensure required DOM anchors exist. If your HTML already has these, nothing is changed.
  function ensureId(id, tag='div', insertBefore = null){
    let el = document.getElementById(id);
    if(!el){
      el = document.createElement(tag);
      el.id = id;
      // If there's a main container, insert into it; otherwise at body start
      const container = document.querySelector('.container') || document.body;
      if(insertBefore && container.querySelector(insertBefore)){
        container.insertBefore(el, container.querySelector(insertBefore));
      } else {
        container.appendChild(el);
      }
      // minimal classes for basic styling if needed
      if(id === 'bullets') el.className = 'bullets';
      if(id === 'features' || id === 'social-proof') el.className = 'features';
      if(id === 'faq-list') el.className = 'faq-list';
    }
    return el;
  }

  // create common anchors used by the script
  // (these are the IDs the copy loader expects)
  ensureId('hero-title', 'h1');
  ensureId('hero-sub', 'p');
  ensureId('cta-primary', 'button');
  ensureId('cta-secondary', 'button');
  ensureId('microcopy', 'div');
  ensureId('bullets', 'div');
  ensureId('features', 'div');
  ensureId('pricing-phrase', 'div');
  ensureId('social-proof', 'div');
  ensureId('faq-list', 'div');
  ensureId('process', 'div');
  ensureId('calendlyInline', 'div');

  // tone/variant and base path
  const tone = document.body.dataset.tone || 'direct';
  const variant = document.body.dataset.variant || 'clean-pro';
  const basePath = location.pathname.replace(/\/[^/]*$/, '/'); // path to root

  // Safe fetch wrapper
  async function loadJSON(path){
    try{
      const res = await fetch(path, {cache: 'no-cache'});
      if(!res.ok) {
        console.warn('loadJSON: failed to fetch', path, res.status);
        return null;
      }
      return await res.json();
    } catch(e){
      console.warn('loadJSON: error parsing', path, e);
      return null;
    }
  }

  const [common, toneCopy] = await Promise.all([
    loadJSON(basePath + 'copy/common.json'),
    loadJSON(basePath + `copy/${tone}.json`)
  ]);

  // Merge copy — toneCopy can override common top-level fields
  const copy = Object.assign({}, common || {}, toneCopy || {});

  // language toggle strings (fallbacks)
  let lang = 'en';
  const translations = {
    en: { hero: copy.hero || (toneCopy && toneCopy.hero) || '', sub: copy.subhead || (toneCopy && toneCopy.subhead) || '' },
    hi: {
      hero: (tone === 'playful') ? "धन्दा ड्रामा? चलो ठीक करें 🚀" : (tone === 'helpful' ? "विकासशील संस्थापकों के लिए स्पष्टता और सिस्टम।" : "अपनी ग्रोथ की रुकावटें — जल्दी ठीक करें।"),
      sub: (tone === 'playful') ? "30 मिनट की चटख़ सलाह — जल्द क्लैरिटी।" : (tone === 'helpful' ? "दोस्ताना, व्यावहारिक बिजनेस कंसल्टेशन — छोटे व्यवसायों के लिए।" : "30 मिनट की कंसल्टेशन बुक करें और कुछ ही घंटों में ROI-ड्रिवन फ़िक्स पाएं।")
    }
  };

  // Populate hero + sub + CTAs + microcopy
  const heroEl = by('hero-title');
  const subEl = by('hero-sub');
  const ctaPrimary = by('cta-primary');
  const ctaSecondary = by('cta-secondary');
  if(heroEl) heroEl.textContent = translations[lang].hero || copy.hero || (toneCopy && toneCopy.hero) || 'Dhanda Booster';
  if(subEl) subEl.textContent = translations[lang].sub || copy.subhead || (toneCopy && toneCopy.subhead) || '';
  if(ctaPrimary) ctaPrimary.textContent = (toneCopy && toneCopy.cta_primary) || copy.cta_primary || 'Book — ₹499';
  if(ctaSecondary) ctaSecondary.textContent = (toneCopy && toneCopy.cta_secondary) || copy.cta_secondary || 'See How';
  if(by('microcopy')) by('microcopy').textContent = (copy.microcopy && copy.microcopy[0]) || 'Enter your best email — we’ll send your booking link.';

  // bullets
  const bulletsWrap = by('bullets');
  if(bulletsWrap && copy.bullets){
    bulletsWrap.innerHTML = '';
    copy.bullets.forEach(b=>{
      const d = document.createElement('div'); d.className='bullet';
      d.innerHTML = `<strong>${b}</strong>`;
      bulletsWrap.appendChild(d);
    });
  }

  // features
  const featuresWrap = by('features');
  if(featuresWrap && copy.features){
    featuresWrap.innerHTML = '';
    copy.features.forEach(f=>{
      const d=document.createElement('div'); d.className='card';
      d.innerHTML = `<h3>${f.title}</h3><p>${f.description}</p>`;
      featuresWrap.appendChild(d);
    });
  }

  // pricing phrase
  const pricingPhrase = by('pricing-phrase');
  if(pricingPhrase && copy.pricing_phrases){
    pricingPhrase.textContent = copy.pricing_phrases[0];
  }

  // social proof
  const proofWrap = by('social-proof');
  if(proofWrap && copy.social_proof){
    proofWrap.innerHTML = '';
    copy.social_proof.forEach(s=>{
      const d=document.createElement('div'); d.className='card';
      d.innerHTML = `<strong>${s}</strong>`;
      proofWrap.appendChild(d);
    });
  }

  // FAQ
  const faqWrap = by('faq-list');
  if(faqWrap && copy.faqs){
    faqWrap.innerHTML = '';
    copy.faqs.forEach(f=>{
      const det = document.createElement('details');
      det.innerHTML = `<summary>${f.q}</summary><p>${f.a}</p>`;
      faqWrap.appendChild(det);
    });
  }

  // process steps
  const processWrap = by('process');
  if(processWrap && copy.process){
    processWrap.innerHTML = '';
    copy.process.forEach((s,i)=>{
      const d=document.createElement('div'); d.className='step';
      d.innerHTML = `<strong>Step ${i+1}</strong><div class="small">${s.replace(/^Step \d:\s*/,'')}</div>`;
      processWrap.appendChild(d);
    });
  }

  // Calendly embed handler
  function openCalendly(){
    const target = by('calendlyInline');
    if(!target) return;
    target.innerHTML = `<div class="calendly-inline-widget" data-url="https://calendly.com/dhandabooster/30min" style="min-width:320px;height:700px;"></div>`;
  }
  if(ctaPrimary) ctaPrimary.addEventListener('click', ()=>{ openCalendly(); window.location.hash='#calendlyInline'; });
  if(ctaSecondary) ctaSecondary.addEventListener('click', ()=>{ openCalendly(); window.location.hash='#calendlyInline'; });

  // payment placeholder
  window.openPayment = function(){ window.open('https://placeholder.pay/razorpay-link','_blank'); };

  // language toggle
  const langBtn = by('langBtn');
  if(langBtn){
    langBtn.addEventListener('click', ()=>{
      lang = (lang==='en') ? 'hi' : 'en';
      heroEl.textContent = translations[lang].hero || (copy.hero || (toneCopy && toneCopy.hero));
      subEl.textContent = translations[lang].sub || (copy.subhead || (toneCopy && toneCopy.subhead));
      ctaPrimary.textContent = (toneCopy && toneCopy.cta_primary) || copy.cta_primary || ctaPrimary.textContent;
      if(by('microcopy')) by('microcopy').textContent = (lang==='en') ? ((copy.microcopy && copy.microcopy[0]) || '') : ((copy.microcopy && copy.microcopy[2]) || '');
      langBtn.textContent = (lang==='en') ? 'हिन्दी' : 'EN';
    });
  }

  // minimal accessibility: focus outlines for keyboard users
  document.addEventListener('keyup', function(e){ if(e.key==='Tab'){ document.body.classList.add('show-focus'); }});

  // load Calendly widget script (only once)
  if(!window.__calendlyLoaded){
    const s=document.createElement('script'); s.src='https://assets.calendly.com/assets/external/widget.js'; s.async=true; document.head.appendChild(s);
    window.__calendlyLoaded = true;
  }

  // small console log for debugging
  console.log('main.js loaded - tone:', tone, 'variant:', variant);
})();

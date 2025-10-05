// DEBUG main.js - temporarily replace original to trace fetches & runtime errors
(async function debugMain(){
  try{
    console.clear();
    console.log("DEBUG main.js starting...");

    // compute base path (same logic used in production)
    const basePath = location.pathname.replace(/\/[^/]*$/, '/');
    console.log("basePath:", basePath);

    const urls = {
      mainJs: basePath + 'js/main.js', // this file (for reference)
      cssCommon: basePath + 'css/common.css',
      copyCommon: basePath + 'copy/common.json',
      copyTone: basePath + 'copy/' + (document.body.dataset?.tone || 'direct') + '.json'
    };
    console.log("Will check URLs:", urls);

    // helper to fetch and log status and optionally json
    async function check(url, asJson=false){
      try{
        const r = await fetch(url, {cache: "no-cache"});
        console.log(url, "=>", r.status, r.statusText);
        if(!r.ok) {
          throw new Error('HTTP ' + r.status + ' ' + r.statusText);
        }
        if(asJson){
          try{
            const j = await r.json();
            console.log(url, "JSON preview:", j && (Array.isArray(j) ? `[array ${j.length}]` : Object.keys(j).slice(0,10)));
            return j;
          } catch(jsonErr){
            console.error(url, "JSON parse error:", jsonErr);
            throw jsonErr;
          }
        }
        return r;
      } catch(err){
        console.error(url, "FETCH ERROR:", err);
        throw err;
      }
    }

    // check files in order
    await check(urls.cssCommon).catch(()=>{});
    // check main.js self (best-effort, it will request itself)
    await check(urls.mainJs).catch(()=>{});
    // check common json
    const common = await check(urls.copyCommon, true).catch(()=>null);
    // check tone json
    const tone = await check(urls.copyTone, true).catch(()=>null);

    // Simple DOM sanity: ensure key elements exist or create placeholders
    function ensureId(id, tag='div'){
      let el = document.getElementById(id);
      if(!el){
        el = document.createElement(tag);
        el.id = id;
        document.body.insertBefore(el, document.body.firstChild);
        console.log('Created missing element #' + id);
      }
      return el;
    }
    ensureId('hero-title','h1');
    ensureId('hero-sub','p');
    ensureId('cta-primary','button');
    ensureId('cta-secondary','button');
    ensureId('microcopy','div');
    ensureId('bullets','div');
    ensureId('features','div');
    ensureId('faq-list','div');

    // Show some populated values so page isn't blank
    const heroEl = document.getElementById('hero-title');
    heroEl.textContent = (tone && tone.hero) || (common && common.hero) || 'Hero: (no hero text found)';
    const subEl = document.getElementById('hero-sub');
    subEl.textContent = (tone && tone.subhead) || (common && common.subhead) || '';
    document.getElementById('cta-primary').textContent = (tone && tone.cta_primary) || (common && common.cta_primary) || 'Book — ₹499';
    document.getElementById('cta-secondary').textContent = (tone && tone.cta_secondary) || (common && common.cta_secondary) || 'See How';
    document.getElementById('microcopy').textContent = (common && common.microcopy && common.microcopy[0]) || 'Microcopy missing';

    // populate bullets/features if present
    const bulletsWrap = document.getElementById('bullets');
    bulletsWrap.innerHTML = '';
    if(common && Array.isArray(common.bullets)){
      common.bullets.forEach(b => {
        const node = document.createElement('div'); node.className='bullet'; node.textContent = b;
        bulletsWrap.appendChild(node);
      });
      console.log("Populated bullets from common.json");
    } else {
      bulletsWrap.textContent = '(no bullets)';
    }

    const featuresWrap = document.getElementById('features');
    featuresWrap.innerHTML = '';
    if(common && Array.isArray(common.features)){
      common.features.forEach(f=>{
        const n = document.createElement('div'); n.className='card';
        n.innerHTML = '<h3>'+f.title+'</h3><p>'+f.description+'</p>';
        featuresWrap.appendChild(n);
      });
      console.log("Populated features from common.json");
    } else {
      featuresWrap.textContent = '(no features)';
    }

    console.log('DEBUG main.js finished successfully. If UI still looks empty, check for CSS loading errors above.');
  } catch(e){
    console.error('Unhandled error in debugMain:', e);
  }
})();

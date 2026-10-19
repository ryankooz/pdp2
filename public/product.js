(() => {
  const form = document.querySelector('[data-veltia-product-form]');
  if (!form) return;
  const buttons = [...form.querySelectorAll('[type="submit"]')];
  const offers = [...form.querySelectorAll('.pdp-offer-input')];
  const status = form.querySelector('.pdp-purchase-status');
  function chooseOffer() {
    const offer = offers.find(input => input.checked);
    const enabled = offer && !offer.disabled && offer.dataset.available === 'true';
    form.querySelector('input[name="id"]').value = enabled ? offer.dataset.variant : '';
    buttons.forEach(button => {
      button.disabled = !enabled;
      const label = button.querySelector('.full-add-to-cart-text');
      if (label) label.textContent = enabled ? 'Add to cart' : 'Unavailable';
    });
    if (status) status.textContent = '';
  }
  offers.forEach(input => input.addEventListener('change', chooseOffer));
  document.querySelectorAll('[data-variant-for]').forEach(select => {
    select.addEventListener('change', () => {
      const offer = document.getElementById(select.dataset.variantFor);
      const option = select.selectedOptions[0];
      offer.dataset.variant = option.value;
      offer.dataset.available = String(!option.disabled);
      offer.dataset.price = option.dataset.price;
      const card = offer.nextElementSibling;
      card.querySelector('.pdp-offer-price').textContent = option.dataset.money;
      const compare = card.querySelector('.pdp-offer-compare');
      if (compare) compare.textContent = option.dataset.compare || '';
      chooseOffer();
    });
  });
  if (!offers.some(input => input.checked && !input.disabled)) {
    const first = offers.find(input => !input.disabled);
    if (first) first.checked = true;
  }
  chooseOffer();
  document.querySelectorAll('a[href="#produit"]').forEach(link => {
    link.href = '#veltia-product-form';
    link.addEventListener('click', () => {
      if (link.textContent.includes('Unlock')) {
        const freedom = offers.find(input => input.value === 'freedom' && !input.disabled);
        if (freedom) { freedom.checked = true; chooseOffer(); }
      }
    });
  });
  // Native POST is used on Shopify. This local preview only persists a demonstrable cart.
  if (form.dataset.preview === 'true') form.addEventListener('submit', event => {
    event.preventDefault();
    const offer = offers.find(input => input.checked && !input.disabled);
    if (!offer) return;
    let cart;
    try { cart = JSON.parse(sessionStorage.getItem('veltia-preview-cart') || '[]'); } catch { cart = []; }
    const existing = cart.find(item => item.program === offer.value);
    if (existing) existing.quantity++;
    else cart.push({program:offer.value, bottles:Number(offer.dataset.bottles),price:Number(offer.dataset.price),quantity:1});
    sessionStorage.setItem('veltia-preview-cart',JSON.stringify(cart));
    document.dispatchEvent(new Event('veltia:cart-updated'));
    status.textContent = 'Added to your cart.';
    openPanel(drawer,buttons[0]);
  });
  document.querySelectorAll('delivery-estimation').forEach(element => {
    const format = new Intl.DateTimeFormat('en-US',{weekday:'short',month:'short',day:'numeric'});
    for (const [ref,days] of [['min-date',Number(element.dataset.minDays)],['max-date',Number(element.dataset.maxDays)]]) {
      const date = new Date();date.setDate(date.getDate()+days);
      const output=element.querySelector(`[data-ref="${ref}"]`);if(output)output.textContent=format.format(date);
    }
  });
  const gallery = document.querySelector('product-media-gallery');
  if (gallery && window.Splide) {
    const mainElement=gallery.querySelector('[data-ref="main-slider"]');
    const thumbElement=gallery.querySelector('[data-ref="thumbnail-slider"]');
    let main, thumbs;
    const breakpoint=matchMedia('(max-width:750px)');
    function updateGallery() {
      main?.destroy(true);thumbs?.destroy(true);main=null;thumbs=null;
      if (breakpoint.matches) {
        main=new Splide(mainElement,{perPage:1,gap:20,arrows:true,pagination:false,rewind:false});
        thumbs=new Splide(thumbElement,{fixedWidth:62,fixedHeight:62,gap:8,isNavigation:true,arrows:false,pagination:false,focus:'center'});
        main.sync(thumbs);main.mount();thumbs.mount();
      } else {
        mainElement.classList.add('is-initialized');
        mainElement.querySelectorAll('li').forEach(el=>el.removeAttribute('aria-hidden'));
      }
    }
    breakpoint.addEventListener('change',updateGallery);updateGallery();
  }
  document.querySelectorAll('slider-component:not(.product-media-gallery)').forEach(component => {
    const element=component.querySelector('.splide');if(!element||!window.Splide)return;
    new Splide(element,{perPage:Number(component.dataset.perPageDesktop)||4,gap:Number(component.dataset.gap)||15,arrows:true,pagination:false,breakpoints:{750:{perPage:Number(component.dataset.perPageMobile)||1.8}}}).mount();
  });
  document.querySelectorAll('deferred-media').forEach(media => {
    const poster=media.querySelector('[data-ref="deferred-media-poster"]');if(!poster)return;
    poster.setAttribute('role','button');poster.tabIndex=0;poster.setAttribute('aria-label','Play customer video');
    const play=() => {
      const template=media.querySelector('template');if(!template)return;
      const video=template.content.querySelector('video').cloneNode(true);
      video.loop=false;video.muted=false;video.autoplay=false;video.preload='metadata';video.controls=true;
      poster.replaceWith(video);video.play().catch(()=>{});
    };
    poster.addEventListener('click',play);
    poster.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();play();}});
  });
})();

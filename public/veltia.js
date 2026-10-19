// Only storefront UI is initialized here. Original analytics and app integrations are excluded.
const drawer = document.querySelector('cart-drawer');
const menu = document.querySelector('[data-ref="mobile-menu-overlay"]');
let opener;
function closePanels() {
  [drawer, menu].forEach(panel => {
    if (!panel) return;
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    panel.inert = true;
  });
  document.body.style.overflow = '';
  document.querySelector('[data-ref="menu-toggle"]')?.setAttribute('aria-expanded','false');
  opener?.focus();
}
function openPanel(panel, target) {
  closePanels();
  opener = target;
  panel.inert = false;
  panel.classList.add('is-open');
  panel.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  panel.querySelector('button, a')?.focus();
}
[drawer,menu].forEach(panel => {
  if (!panel) return;
  panel.inert = true;
  panel.setAttribute('aria-hidden','true');
  panel.setAttribute('role','dialog');
  panel.setAttribute('aria-modal','true');
  panel.setAttribute('aria-label',panel === drawer ? 'Shopping cart' : 'Navigation menu');
  panel.addEventListener('click', event => { if(event.target === panel) closePanels(); });
});
document.querySelectorAll('cart-icon').forEach(icon => {
  icon.setAttribute('role','button');icon.tabIndex=0;icon.setAttribute('aria-label','Open shopping cart');
  icon.addEventListener('click',()=>openPanel(drawer,icon));
  icon.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();openPanel(drawer,icon);}});
});
document.querySelectorAll('.cart-drawer__close,.cart-drawer__empty-close,[data-ref="menu-close"]').forEach(button=>button.addEventListener('click',closePanels));
document.querySelectorAll('cart-drawer button').forEach(button=>{if(button.textContent.trim()==='Continue shopping')button.addEventListener('click',closePanels);});
const menuToggle=document.querySelector('[data-ref="menu-toggle"]');
menuToggle?.setAttribute('aria-label','Open navigation');menuToggle?.setAttribute('aria-expanded','false');
menuToggle?.addEventListener('click',()=>{openPanel(menu,menuToggle);menuToggle.setAttribute('aria-expanded','true');});
document.querySelectorAll('.header__icon-account').forEach(link=>link.setAttribute('aria-label','Account'));
document.querySelectorAll('.cart-drawer__close,[data-ref="menu-close"]').forEach(button=>button.setAttribute('aria-label','Close'));
document.addEventListener('keydown',event=>{
 if(event.key==='Escape')closePanels();
 if(event.key!=='Tab')return;
 const panel=[drawer,menu].find(p=>p?.classList.contains('is-open'));if(!panel)return;
 const items=[...panel.querySelectorAll('a[href],button:not([disabled]),[tabindex="0"]')].filter(el=>el.getClientRects().length);
 if(!items.length)return;
 const first=items[0],last=items.at(-1);
 if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
 else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
});
// Duplicate the existing announcement items to make a seamless strip at every screen width.
document.querySelectorAll('marquee-component').forEach(marquee=>{
 const content=marquee.querySelector('.marquee__content');if(!content)return;
 const item=content.firstElementChild;if(!item)return;
 while(content.scrollWidth<window.innerWidth+item.scrollWidth){const copy=item.cloneNode(true);copy.setAttribute('aria-hidden','true');copy.querySelectorAll('[id]').forEach(x=>x.removeAttribute('id'));content.append(copy);}
 const copy=content.cloneNode(true);copy.setAttribute('aria-hidden','true');copy.querySelectorAll('[id]').forEach(x=>x.removeAttribute('id'));content.parentElement.append(copy);
 marquee.style.setProperty('--marquee-speed',`${Math.max(25,content.scrollWidth/Number(marquee.dataset.speedFactor||20))}s`);
});

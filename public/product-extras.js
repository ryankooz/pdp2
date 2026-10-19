
  (function () {
    var piste = document.getElementById('lynaeResPiste');
    if (!piste) return;

    var actif = false, aBouge = false;
    var departX = 0, departScroll = 0;
    var dernierX = 0, dernierT = 0, vitesse = 0;
    var indexDepart = 0;
    var anim = null;

    var moinsDeMouvement = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- boucle infinie ---
    // la serie reelle est encadree par deux copies : quand on derive dans une copie,
    // on se replace d'une serie en arriere ou en avant. Le contenu etant identique,
    // le saut est invisible.
    var cartesOrigine = Array.prototype.slice.call(piste.querySelectorAll('.lynae-res__slide'));
    var largeurSerie = 0;

    function mesurerSerie() {
      largeurSerie = pas() * cartesOrigine.length;
    }

    function installerBoucle() {
      if (cartesOrigine.length < 2) return;
      var avant = document.createDocumentFragment();
      var apres = document.createDocumentFragment();
      cartesOrigine.forEach(function (carte) {
        var a = carte.cloneNode(true);
        a.setAttribute('aria-hidden', 'true');
        avant.appendChild(a);
        var b = carte.cloneNode(true);
        b.setAttribute('aria-hidden', 'true');
        apres.appendChild(b);
      });
      piste.insertBefore(avant, cartesOrigine[0]);
      piste.appendChild(apres);
      mesurerSerie();
      // apres le premier rendu : une affectation trop precoce est ecrasee par le navigateur
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          mesurerSerie();
          piste.scrollLeft = largeurSerie;
        });
      });
    }

    function recentrer() {
      if (!largeurSerie || actif || anim) return;
      if (piste.scrollLeft < largeurSerie * 0.5) {
        piste.scrollLeft += largeurSerie;
        departScroll += largeurSerie;
      } else if (piste.scrollLeft >= largeurSerie * 1.5) {
        piste.scrollLeft -= largeurSerie;
        departScroll -= largeurSerie;
      }
    }

    var minuteurRepos = null;
    piste.addEventListener('scroll', function () {
      clearTimeout(minuteurRepos);
      minuteurRepos = setTimeout(recentrer, 140);
    }, { passive: true });

    window.addEventListener('resize', function () {
      mesurerSerie();
    });

    function annulerAnim() {
      if (anim) { cancelAnimationFrame(anim); anim = null; }
    }

    // largeur d'une carte + gouttiere, mesuree sur le rendu reel
    function pas() {
      var cartes = piste.querySelectorAll('.lynae-res__slide');
      if (cartes.length < 2) { return cartes.length ? cartes[0].offsetWidth : 1; }
      return cartes[1].offsetLeft - cartes[0].offsetLeft;
    }

    function borne(v) {
      return Math.max(0, Math.min(v, piste.scrollWidth - piste.clientWidth));
    }

    function animerVers(cible, duree) {
      var depart = piste.scrollLeft;
      var delta = cible - depart;
      if (Math.abs(delta) < 1 || moinsDeMouvement) {
        piste.scrollLeft = cible;
        piste.classList.remove('est-glisse');
        recentrer();
        return;
      }
      var t0 = performance.now();
      function etape(t) {
        var avancee = Math.min(1, (t - t0) / duree);
        var adouci = 1 - Math.pow(1 - avancee, 3);
        piste.scrollLeft = depart + delta * adouci;
        if (avancee < 1) {
          anim = requestAnimationFrame(etape);
        } else {
          anim = null;
          piste.classList.remove('est-glisse');
          recentrer();
        }
      }
      anim = requestAnimationFrame(etape);
    }

    function lancerInertie() {
      var largeurPas = pas();
      var deplacement = piste.scrollLeft - departScroll;

      // un geste franc fait avancer d'exactement une carte ; sinon on revient en place
      var seuilDistance = largeurPas * 0.18;
      var seuilVitesse = 0.3;
      var sens = 0;
      if (Math.abs(deplacement) > seuilDistance || Math.abs(vitesse) > seuilVitesse) {
        sens = (deplacement !== 0 ? deplacement : vitesse) > 0 ? 1 : -1;
      }

      var cible = borne((indexDepart + sens) * largeurPas);
      // geste rapide : on raccourcit legerement pour garder du repondant
      var duree = Math.abs(vitesse) > 1 ? 320 : 420;
      animerVers(cible, duree);
    }

    piste.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') return; // le tactile a deja son inertie native
      annulerAnim();
      actif = true; aBouge = false;
      departX = e.clientX;
      departScroll = piste.scrollLeft;
      indexDepart = Math.round(departScroll / pas());
      dernierX = e.clientX;
      dernierT = performance.now();
      vitesse = 0;
      piste.classList.add('est-glisse');
      try { piste.setPointerCapture(e.pointerId); } catch (err) {}
    });

    piste.addEventListener('pointermove', function (e) {
      if (!actif) return;
      var maintenant = performance.now();
      var ecart = maintenant - dernierT;
      if (ecart > 0) {
        var instantanee = (dernierX - e.clientX) / ecart;
        vitesse = vitesse * 0.7 + instantanee * 0.3; // lissage
      }
      dernierX = e.clientX;
      dernierT = maintenant;

      var delta = e.clientX - departX;
      if (Math.abs(delta) > 3) { aBouge = true; }
      piste.scrollLeft = departScroll - delta;
    });

    function relacher(e) {
      if (!actif) return;
      actif = false;
      if (e && e.pointerId !== undefined) {
        try { piste.releasePointerCapture(e.pointerId); } catch (err) {}
      }
      // si le doigt s'est arrete avant le relachement, pas d'elan
      if (performance.now() - dernierT > 120) { vitesse = 0; }
      lancerInertie();
    }

    piste.addEventListener('pointerup', relacher);
    piste.addEventListener('pointercancel', relacher);
    window.addEventListener('pointerup', relacher);
    window.addEventListener('blur', function () { relacher(); });
    piste.addEventListener('click', function (e) { if (aBouge) { e.preventDefault(); } }, true);
    piste.addEventListener('dragstart', function (e) { e.preventDefault(); });

    function decaler(sens) {
      annulerAnim();
      var largeurPas = pas();
      var index = Math.round(piste.scrollLeft / largeurPas);
      piste.classList.add('est-glisse');
      animerVers(borne((index + sens) * largeurPas), 420);
    }

    var btnPrec = document.getElementById("lynaeResPrec");
    var btnSuiv = document.getElementById("lynaeResSuiv");
    if (btnPrec) { btnPrec.addEventListener("click", function () { decaler(-1); }); }
    if (btnSuiv) { btnSuiv.addEventListener("click", function () { decaler(1); }); }

    installerBoucle();
  })();


(function () {
  function isVisual(el) {
    return el && el.tagName !== 'STYLE' && el.tagName !== 'SCRIPT'
      && el.tagName !== 'LINK' && el.tagName !== 'TEMPLATE';
  }
  function nextVisual(el) {
    var n = el.nextElementSibling;
    while (n && !isVisual(n)) n = n.nextElementSibling;
    return n;
  }

  function init(root) {
    var containers = (root || document).querySelectorAll('.lyv-readmore:not([data-lyv-init])');
    containers.forEach(function (container) {
      container.setAttribute('data-lyv-init', '1');
      var btn = container.querySelector('.lyv-readmore__link');
      var label = container.querySelector('.lyv-readmore__label');

      var wrapper = container;
      while (wrapper.parentElement && !nextVisual(wrapper)) {
        wrapper = wrapper.parentElement;
      }
      wrapper.style.gridColumn = '1 / -1';

      var parent = wrapper.parentElement;
      var anchor = document.createComment('lyv-readmore-anchor');
      parent.insertBefore(anchor, wrapper); /* mémorise la position d'origine */

      var hidden = [];
      var el = nextVisual(wrapper);
      while (el) {
        hidden.push(el);
        el.style.display = 'none';
        el = nextVisual(el);
      }
      if (hidden.length === 0) return;

      btn.addEventListener('click', function () {
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        if (!expanded) {
          /* Déplie : montre les avis, envoie le lien tout en bas */
          hidden.forEach(function (b) { b.style.display = ''; });
          parent.appendChild(wrapper);
        } else {
          /* Replie : cache les avis, remonte le lien à sa place d'origine */
          hidden.forEach(function (b) { b.style.display = 'none'; });
          parent.insertBefore(wrapper, anchor.nextSibling);
          wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        btn.setAttribute('aria-expanded', String(!expanded));
        label.textContent = expanded ? 'Read more reviews' : 'Show fewer reviews';
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); });
  } else {
    init();
  }
  document.addEventListener('shopify:section:load', function (e) { init(e.target); });
})();


(function () {
  function isVisual(el) {
    return el &&
      el.tagName !== 'STYLE' &&
      el.tagName !== 'SCRIPT' &&
      el.tagName !== 'LINK' &&
      el.tagName !== 'TEMPLATE';
  }

  function nextVisual(el) {
    var n = el.nextElementSibling;
    while (n && !isVisual(n)) n = n.nextElementSibling;
    return n;
  }

  function init(root) {
    var containers = (root || document).querySelectorAll('.lyv-guide-readmore:not([data-lyv-guide-init])');

    containers.forEach(function (container) {
      container.setAttribute('data-lyv-guide-init', '1');

      var btn = container.querySelector('.lyv-guide-readmore__link');
      var label = container.querySelector('.lyv-guide-readmore__label');

      var wrapper = container;
      while (wrapper.parentElement && !nextVisual(wrapper)) {
        wrapper = wrapper.parentElement;
      }

      wrapper.style.gridColumn = '1 / -1';

      var parent = wrapper.parentElement;
      var anchor = document.createComment('lyv-guide-anchor');
      parent.insertBefore(anchor, wrapper);

      var hidden = [];
      var el = nextVisual(wrapper);

      while (el) {
        hidden.push(el);
        el.style.display = 'none';
        el = nextVisual(el);
      }

      if (hidden.length === 0) return;

      btn.addEventListener('click', function () {
        var expanded = btn.getAttribute('aria-expanded') === 'true';

        if (!expanded) {
          hidden.forEach(function (b) {
            b.style.display = '';
          });
          parent.appendChild(wrapper);
        } else {
          hidden.forEach(function (b) {
            b.style.display = 'none';
          });
          parent.insertBefore(wrapper, anchor.nextSibling);
          wrapper.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }

        btn.setAttribute('aria-expanded', String(!expanded));
        label.textContent = expanded
          ? "Click here to reveal what you'll discover inside:"
          : "Hide the contents";
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init();
    });
  } else {
    init();
  }

  document.addEventListener('shopify:section:load', function (e) {
    init(e.target);
  });
})();

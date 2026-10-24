/* ══════════════════════════════════════════
   OUTSKIRT AMMAN — script.js
   GSAP + ScrollTrigger + Lenis
   ══════════════════════════════════════════ */
(function () {
  "use strict";

  const hasGSAP = typeof window.gsap !== "undefined";
  if (hasGSAP && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ───── 1. SMOOTH SCROLL ───── */
  let lenis = null;
  if (typeof window.Lenis !== "undefined" && !reduce) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true, lerp: .09 });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    if (hasGSAP && window.ScrollTrigger) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (href.length < 2) return;
      const el = document.querySelector(href);
      if (!el) return;
      e.preventDefault();
      lenis ? lenis.scrollTo(el, { offset: -70 }) : el.scrollIntoView({ behavior: "smooth" });
      document.getElementById("navLinks")?.classList.remove("open");
    });
  });

  /* ───── 2. SPLIT TEXT ───── */
  document.querySelectorAll("[data-split]").forEach((el) => {
    const txt = el.textContent;
    el.textContent = "";
    [...txt].forEach((c) => {
      const s = document.createElement("span");
      s.className = "ch";
      s.textContent = c === " " ? "\u00A0" : c;
      el.appendChild(s);
    });
  });

  /* ───── 3. PRELOADER ───── */
  const pre = document.getElementById("preloader");
  document.body.style.overflow = "hidden";
  let started = false;
  function killPre() {
    if (started) return;
    started = true;
    pre.classList.add("done");
    document.body.style.overflow = "";
    if (hasGSAP && !reduce) introTL();
  }
  window.addEventListener("load", () => setTimeout(killPre, 2100));
  setTimeout(killPre, 4300);

  /* ───── 4. HERO INTRO ───── */
  function introTL() {
    gsap.timeline({ defaults: { ease: "power4.out" } })
      .from(".nav", { y: -70, opacity: 0, duration: 1 })
      .from(".hero-eyebrow", { y: 22, opacity: 0, duration: .9 }, "-=.6")
      .from(".hero-title .ch", {
        yPercent: 118, opacity: 0, rotateX: -92, duration: 1.15, stagger: .05
      }, "-=.5")
      .from(".hero-sub", { y: 20, opacity: 0, duration: .8 }, "-=.7")
      .from(".hero-ar", { y: 16, opacity: 0, duration: .8 }, "-=.65")
      .from(".hero-btns a", { y: 20, opacity: 0, duration: .8, stagger: .1 }, "-=.6")
      .from(".hero-marquee", { y: 40, opacity: 0, duration: .9 }, "-=.5");
  }

  /* ───── 5. HERO SLIDESHOW ───── */
  const slides = document.querySelectorAll(".hs");
  let sIdx = 0;
  if (slides.length > 1) {
    setInterval(() => {
      slides[sIdx].classList.remove("is-on");
      sIdx = (sIdx + 1) % slides.length;
      slides[sIdx].classList.add("is-on");
    }, 4200);
  }

  /* ───── 6. COVERFLOW CAROUSEL (3D) ───── */
  const coverItems = [...document.querySelectorAll(".c-item")];
  let cIdx = Math.floor(coverItems.length / 2);
  const C = coverItems.length;

  function layoutCover() {
    const isMobile = window.innerWidth < 760;
    const xStep = isMobile ? 120 : 200;
    const zStep = isMobile ? 90 : 150;
    coverItems.forEach((el, i) => {
      let d = i - cIdx;
      // wrap for a smooth infinite ring
      if (d > C / 2) d -= C;
      if (d < -C / 2) d += C;
      const abs = Math.abs(d);
      el.style.transform =
        `translate(-50%,0) translateX(${d * xStep}px) translateZ(${-abs * zStep}px) ` +
        `rotateY(${d * -26}deg) scale(${1 - abs * 0.05})`;
      el.style.opacity = abs > 2.6 ? 0 : 1;
      el.style.zIndex = 100 - abs;
      el.classList.toggle("is-focus", d === 0);
    });
  }
  function moveCover(dir) {
    cIdx = (cIdx + dir + C) % C;
    layoutCover();
  }
  if (coverItems.length) {
    layoutCover();
    window.addEventListener("resize", layoutCover);
    document.getElementById("cNext")?.addEventListener("click", () => moveCover(1));
    document.getElementById("cPrev")?.addEventListener("click", () => moveCover(-1));
    // drag / swipe
    const stage = document.getElementById("coverStage");
    let down = false, startX = 0;
    stage?.addEventListener("pointerdown", (e) => { down = true; startX = e.clientX; });
    stage?.addEventListener("pointerup", (e) => {
      if (!down) return; down = false;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 45) moveCover(dx > 0 ? -1 : 1);
    });
    stage?.addEventListener("pointerleave", () => (down = false));
    stage?.addEventListener("wheel", (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 14) {
        moveCover(e.deltaX > 0 ? 1 : -1);
      }
    }, { passive: true });
  }

  /* ───── 7. SCROLL REVEALS ───── */
  if (hasGSAP && window.ScrollTrigger && !reduce) {

    gsap.utils.toArray(".sec-head").forEach((h) => {
      gsap.from(h.children, {
        y: 50, opacity: 0, duration: 1.05, stagger: .13, ease: "power3.out",
        scrollTrigger: { trigger: h, start: "top 86%" }
      });
    });

    gsap.from(".tabs .tab", {
      y: 26, opacity: 0, duration: .8, stagger: .07, ease: "power3.out",
      scrollTrigger: { trigger: ".tabs", start: "top 88%" }
    });

    // masonry — 3D flip-in with alternating rotation
    gsap.utils.toArray(".m-item").forEach((el, i) => {
      gsap.from(el, {
        rotateY: i % 2 ? 40 : -40, rotateX: 14, z: -260, y: 80, opacity: 0,
        duration: 1.3, ease: "power3.out", delay: (i % 3) * .08,
        scrollTrigger: { trigger: "#masonry", start: "top 84%" }
      });
      gsap.to(el, {
        y: i % 2 ? -30 : 30, ease: "none",
        scrollTrigger: { trigger: "#masonry", start: "top bottom", end: "bottom top", scrub: 1 }
      });
    });
    gsap.fromTo("#masonry", { rotateX: 7 }, {
      rotateX: -5, ease: "none",
      scrollTrigger: { trigger: "#lookbook", start: "top bottom", end: "bottom top", scrub: 1.2 }
    });

    // product cards
    gsap.from(".p-card", {
      y: 66, opacity: 0, scale: .94, rotateX: 13, duration: .95, stagger: .06,
      ease: "power3.out",
      scrollTrigger: { trigger: "#shopGrid", start: "top 84%" }
    });

    // reels phones
    gsap.from(".phone", {
      y: 110, opacity: 0, rotateY: (i) => (i % 2 ? 26 : -26), scale: .9,
      duration: 1.15, stagger: .12, ease: "power3.out",
      scrollTrigger: { trigger: ".reels-row", start: "top 82%" }
    });

    // about
    gsap.from(".about-copy p", {
      y: 36, opacity: 0, duration: 1, stagger: .14, ease: "power3.out",
      scrollTrigger: { trigger: ".about", start: "top 82%" }
    });
    gsap.to(".about-visual", {
      y: -48, ease: "none",
      scrollTrigger: { trigger: ".about", start: "top bottom", end: "bottom top", scrub: 1.1 }
    });

    // contact cards
    gsap.from(".c-card", {
      y: 60, opacity: 0, rotateX: 12, duration: 1.05, stagger: .14, ease: "power3.out",
      scrollTrigger: { trigger: ".c-grid", start: "top 85%" }
    });

    // footer wordmark
    gsap.from(".f-big .ch", {
      yPercent: 100, opacity: 0, duration: .9, stagger: .035, ease: "power3.out",
      scrollTrigger: { trigger: ".f-big", start: "top 92%" }
    });

    // hero parallax
    gsap.to(".hero-content", {
      yPercent: 32, opacity: 0, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "30% top", end: "bottom top", scrub: true }
    });

    // counters
    gsap.utils.toArray("[data-count]").forEach((el) => {
      const target = +el.dataset.count, o = { v: 0 };
      gsap.to(o, {
        v: target, duration: 2, ease: "power2.out",
        onUpdate: () => {
          el.textContent = target >= 1000
            ? Math.floor(o.v).toLocaleString("en-US") + "+"
            : Math.floor(o.v);
        },
        scrollTrigger: { trigger: el, start: "top 90%" }
      });
    });

    // marquee reacts to scroll velocity
    const hm = document.querySelector(".hm-track");
    if (hm) {
      ScrollTrigger.create({
        trigger: ".hero", start: "top top", end: "bottom top",
        onUpdate: (self) => {
          const v = gsap.utils.clamp(.6, 5, 1 + Math.abs(self.getVelocity()) / 1500);
          hm.style.animationDuration = (30 / v) + "s";
        }
      });
    }
  }

  /* ───── 8. NAV STATE ───── */
  const nav = document.getElementById("nav");
  const onScroll = () => nav.classList.toggle("solid", window.scrollY > 60);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  document.getElementById("burger")?.addEventListener("click", () =>
    document.getElementById("navLinks").classList.toggle("open"));

  /* ───── 9. SHOP FILTER ───── */
  const tabs = document.querySelectorAll(".tab");
  const cards = document.querySelectorAll(".p-card");
  tabs.forEach((t) => t.addEventListener("click", () => {
    tabs.forEach((x) => x.classList.remove("is-on"));
    t.classList.add("is-on");
    const f = t.dataset.f;
    cards.forEach((c) => c.classList.toggle("hide", !(f === "all" || c.dataset.cat === f)));
    if (hasGSAP && !reduce) {
      gsap.fromTo(".p-card:not(.hide)",
        { opacity: 0, y: 24, scale: .96 },
        { opacity: 1, y: 0, scale: 1, duration: .55, stagger: .045,
          ease: "power3.out", clearProps: "transform" });
    }
  }));

  /* ───── 10. CUSTOM CURSOR ───── */
  const cur = document.getElementById("cursor");
  if (cur && window.matchMedia("(hover:hover)").matches && !reduce) {
    let cx = 0, cy = 0, tx = 0, ty = 0;
    window.addEventListener("mousemove", (e) => {
      tx = e.clientX; ty = e.clientY; cur.classList.remove("hide");
    });
    (function loop() {
      cx += (tx - cx) * .18; cy += (ty - cy) * .18;
      cur.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll("a,button,.p-card,.m-item,.phone,.c-card,.c-item")
      .forEach((el) => {
        el.addEventListener("mouseenter", () => cur.classList.add("grow"));
        el.addEventListener("mouseleave", () => cur.classList.remove("grow"));
      });
    document.addEventListener("mouseleave", () => cur.classList.add("hide"));
  }

  /* ───── 11. 3D TILT ───── */
  if (window.matchMedia("(hover:hover)").matches && !reduce) {
    document.querySelectorAll("[data-tilt]").forEach((el) => {
      const S = 10;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5;
        const py = (e.clientY - r.top) / r.height - .5;
        el.style.transition = "";
        el.style.transform =
          `perspective(1000px) rotateY(${px * S * 2}deg) rotateX(${-py * S * 2}deg) translateZ(14px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transition = "transform .7s cubic-bezier(.22,1,.36,1)";
        el.style.transform = "perspective(1000px) rotateY(0) rotateX(0) translateZ(0)";
      });
    });
  }

  /* ───── 12. AUTOPLAY VIDEOS IN VIEW ───── */
  const vids = document.querySelectorAll(".phone video");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        const v = e.target;
        e.isIntersecting ? v.play().catch(() => {}) : v.pause();
      });
    }, { threshold: .35 });
    vids.forEach((v) => io.observe(v));
  }
  document.querySelectorAll(".phone").forEach((p) => {
    const v = p.querySelector("video");
    if (!v) return;
    p.addEventListener("mouseenter", () => { v.muted = false; v.volume = .4; });
    p.addEventListener("mouseleave", () => { v.muted = true; });
  });

  /* ───── 13. LANGUAGE TOGGLE ───── */
  const EN = {
    new:"New In", lookbook:"Lookbook", shop:"Shop", reels:"Reels",
    about:"About", contact:"Contact",
    e1:"Sweifieh Avenue Mall · Amman", s1:"you always deserve the best",
    ar1:"Your clothes speak for you — our touch makes the difference.",
    b1:"Shop now", b2:"Follow on Instagram",
    l1:"NEW IN", t1:"New Arrivals", sub1:"Swipe to explore the new pieces",
    l2:"LOOKBOOK", t2:"The Lookbook", sub2:"Looks we styled for you",
    l3:"SHOP", t3:"Shop the Collection",
    tab1:"All", tab2:"Dresses", tab3:"Tops", tab4:"Sets", tab5:"Abayas",
    buy:"Order on Instagram",
    t4:"Reels from the store", sub4:"See the pieces in motion",
    buy2:"Browse all pieces on Instagram",
    l5:"OUR STORY",
    t5:"Your clothes speak for you,<br>our touch makes the difference.",
    p5a:"Outskirt Amman — exclusive womenswear, carefully curated, blending Turkish elegance with Jordanian taste. Every piece is hand-picked and delivered in style.",
    p5b:"Find us at Sweifieh Avenue Mall, Amman. New pieces arrive every day. You always deserve the best.",
    st1:"Followers", st2:"Posts", st3:"Pieces shown",
    l6:"VISIT US", t6:"Come visit the store",
    c1:"Sweifieh, Amman, Jordan", c1b:"Open the map ←",
    c2:"Orders & enquiries", c2b:"Call or DM us on Instagram",
    c3:"Everything new, first", c3b:"@outskirt_amman ←",
    f1:"Store", f2:"Contact", f3:"Follow",
    fc:"© " + new Date().getFullYear() + " Outskirt Amman · All rights reserved"
  };
  const AR = {};
  document.querySelectorAll("[data-i18n]").forEach((el) => { AR[el.dataset.i18n] = el.textContent; });

  let isEN = false;
  document.getElementById("langBtn")?.addEventListener("click", () => {
    isEN = !isEN;
    document.documentElement.lang = isEN ? "en" : "ar";
    document.documentElement.dir = isEN ? "ltr" : "rtl";
    document.body.classList.toggle("en", isEN);
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const k = el.dataset.i18n;
      const dict = isEN ? EN : AR;
      if (dict[k]) el.innerHTML = dict[k];
    });
    if (hasGSAP && !reduce) {
      gsap.fromTo("#productGrid, .shop-grid", { opacity: .3 }, { opacity: 1, duration: .5 });
    }
  });

  /* ───── 14. PHONE FORMAT ───── */
  const ph = document.getElementById("storePhone");
  if (ph) {
    const raw = ph.dataset.phone;
    ph.textContent = raw.replace(/^\+?962/, "+962 ").replace(/(\d{2})(\d{3})(\d{4})$/, "$1 $2 $3");
    ph.href = "tel:" + raw;
  }

  /* ───── 15. YEAR ───── */
  document.getElementById("yr").textContent = new Date().getFullYear();
})();

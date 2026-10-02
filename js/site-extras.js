/* =========================================================
   GROSTO - Shared extras
   1) Live search suggestions (type a product -> tap -> product page)
   2) WhatsApp chat floating button (uses number from Admin Settings)
   Requires: supabase-client.js loaded BEFORE this file
   ========================================================= */

(function () {

  /* ---------- styles ---------- */

  var style = document.createElement("style");

  style.textContent = [
    ".sg-box{position:absolute;top:calc(100% + 6px);left:0;right:0;background:#fff;border:1px solid #E3E6E4;border-radius:14px;box-shadow:0 12px 32px rgba(0,0,0,.14);z-index:1200;display:none;max-height:70vh;overflow-y:auto}",
    ".sg-box.show{display:block}",
    ".sg-item{display:flex;align-items:center;gap:12px;padding:10px 14px;cursor:pointer;border-bottom:1px solid #F0F2F1}",
    ".sg-item:last-child{border-bottom:none}",
    ".sg-item:hover{background:#E8F5EC}",
    ".sg-thumb{width:44px;height:44px;border-radius:10px;background:#F7F8F7;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;overflow:hidden}",
    ".sg-thumb img{width:100%;height:100%;object-fit:cover}",
    ".sg-name{font-weight:700;font-size:14px;color:#000}",
    ".sg-meta{font-size:12px;color:#666}",
    ".sg-price{margin-left:auto;font-weight:900;color:#1EAF59;font-size:14px;white-space:nowrap}",
    ".sg-empty{padding:16px;color:#666;font-size:14px;text-align:center}",
    ".wa-float{position:fixed;left:18px;bottom:18px;z-index:998;width:52px;height:52px;border-radius:50%;background:#25D366;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px rgba(0,0,0,.25);text-decoration:none;font-size:24px}"
  ].join("\n");

  document.head.appendChild(style);


  /* ---------- helpers ---------- */

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  window.groEsc = esc;

  var productCache = null;
  var loadingPromise = null;

  function loadAllProducts() {

    if (productCache) return Promise.resolve(productCache);

    if (loadingPromise) return loadingPromise;

    loadingPromise = grostoDB
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("id")
      .then(function (res) {
        productCache = res.data || [];
        return productCache;
      });

    return loadingPromise;
  }

  function thumbHtml(p) {

    var imgs = Array.isArray(p.images) ? p.images.filter(Boolean) : [];

    if (imgs.length) {
      return '<img src="' + esc(imgs[0]) + '" alt="" loading="lazy">';
    }

    return esc(p.emoji || "");
  }


  /* ---------- 1) SEARCH SUGGESTIONS ---------- */

  window.initSearchSuggest = function (inputId) {

    var input = document.getElementById(inputId);

    if (!input) return;

    var wrap = input.parentElement;

    wrap.style.position = "relative";

    var box = document.createElement("div");

    box.className = "sg-box";

    wrap.appendChild(box);

    function render() {

      var q = input.value.trim().toLowerCase();

      if (!q) {
        box.classList.remove("show");
        return;
      }

      loadAllProducts().then(function (list) {

        if (input.value.trim().toLowerCase() !== q) return;

        var matches = list.filter(function (p) {
          return (p.name || "").toLowerCase().indexOf(q) > -1 ||
                 (p.name_urdu || "").toLowerCase().indexOf(q) > -1 ||
                 (p.category || "").toLowerCase().indexOf(q) > -1;
        }).slice(0, 6);

        if (!matches.length) {

          box.innerHTML = '<div class="sg-empty">Koi product nahi mila</div>';

        } else {

          box.innerHTML = matches.map(function (p) {

            return '<div class="sg-item" data-id="' + p.id + '">' +
              '<div class="sg-thumb">' + thumbHtml(p) + '</div>' +
              '<div>' +
                '<div class="sg-name">' + esc(p.name) + '</div>' +
                '<div class="sg-meta">' + esc(p.category) + ' &middot; ' + esc(p.unit) + '</div>' +
              '</div>' +
              '<div class="sg-price">Rs. ' + p.price + '</div>' +
            '</div>';

          }).join("");
        }

        box.classList.add("show");
      });
    }

    input.addEventListener("input", render);

    input.addEventListener("focus", function () {
      if (input.value.trim()) render();
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") box.classList.remove("show");
    });

    box.addEventListener("click", function (e) {

      var item = e.target.closest(".sg-item");

      if (!item) return;

      window.location.href = "product.html?id=" + item.getAttribute("data-id");
    });

    document.addEventListener("click", function (e) {
      if (!wrap.contains(e.target)) box.classList.remove("show");
    });
  };


  /* ---------- 2) WHATSAPP FLOAT BUTTON ---------- */

  window.initWhatsAppFloat = function () {

    getGrostoSettings().then(function (s) {

      var n = (s.whatsapp_number || "").replace(/\D/g, "");

      // Placeholder / incomplete numbers are ignored
      if (!/^\d{11,15}$/.test(n)) return;

      var a = document.createElement("a");

      a.className = "wa-float";

      a.href = "https://wa.me/" + n + "?text=" +
        encodeURIComponent("Assalam o Alaikum, mujhe GROSTO se kuch poochna hai.");

      a.target = "_blank";

      a.rel = "noopener";

      a.setAttribute("aria-label", "Chat on WhatsApp");

      a.innerHTML = "\u{1F4AC}";

      document.body.appendChild(a);
    });
  };


  /* ---------- 3) SITE LOGO + FAVICON (admin-uploaded) ---------- */

  var LOGO_CACHE_KEY = "grostoBrandingCache";

  function paintLogo(logoUrl) {

    if (!logoUrl) return;

    document.querySelectorAll(".logo, .footer-logo").forEach(function (el) {

      // already showing this exact logo? skip (avoids a pointless re-flash)
      var existingImg = el.querySelector("img");

      if (existingImg && existingImg.src === logoUrl) return;

      var label = el.querySelector(".logo-label");

      el.innerHTML = "";

      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.gap = "10px";

      var img = document.createElement("img");

      img.src = logoUrl;
      img.alt = "GROSTO";
      img.style.height = "38px";
      img.style.display = "block";

      el.appendChild(img);

      if (label) el.appendChild(label);
    });
  }

  function paintFavicon(faviconUrl, bust) {

    if (!faviconUrl) return;

    var link = document.querySelector('link[rel="icon"]');

    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }

    // cache-bust only when we have a fresh value, not on the instant cached paint
    link.href = bust
      ? faviconUrl + (faviconUrl.indexOf("?") === -1 ? "?v=" : "&v=") + Date.now()
      : faviconUrl;
  }

  // Paint instantly from last-known values (no network wait) so repeat visits
  // don't flash the default text logo / old banner before the real one loads.
  try {

    var cached = JSON.parse(localStorage.getItem(LOGO_CACHE_KEY) || "null");

    if (cached) {

      paintLogo(cached.logo);
      paintFavicon(cached.favicon || cached.logo, false);
    }

  } catch (e) {}

  window.applySiteLogo = function () {

    getGrostoSettings().then(function (s) {

      paintLogo(s.site_logo);

      paintFavicon(s.site_favicon || s.site_logo, true);

      try {

        localStorage.setItem(LOGO_CACHE_KEY, JSON.stringify({
          logo: s.site_logo || null,
          favicon: s.site_favicon || null
        }));

      } catch (e) {}
    });
  };

})();

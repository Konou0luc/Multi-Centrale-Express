const header = document.querySelector("[data-header]");
const burger = document.querySelector("[data-burger]");
const nav = document.querySelector("[data-nav]");

const onScroll = () => {
  if (!header) return;
  header.classList.toggle("is-solid", window.scrollY > 80);
};
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

burger?.addEventListener("click", () => {
  const open = document.body.classList.toggle("nav-open");
  burger.setAttribute("aria-expanded", open ? "true" : "false");
  burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
});

nav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("nav-open");
    burger?.setAttribute("aria-expanded", "false");
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    document.body.classList.remove("nav-open");
    burger?.setAttribute("aria-expanded", "false");
  }
});

const page = document.body.dataset.page;
const section = document.body.dataset.section;
document.querySelectorAll("[data-navlink]").forEach((link) => {
  if (link.getAttribute("href") === page) link.classList.add("is-active");
});
if (section === "services") document.querySelector("[data-drop]")?.classList.add("is-active");

const hero = document.querySelector("[data-hero-carousel]");
if (hero) {
  const slides = [...hero.querySelectorAll(".hero-slide")];
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let index = 0;
  let timer = 0;

  const show = (next) => {
    const current = slides[index];
    const videoOff = current.querySelector("video");
    if (videoOff) {
      videoOff.pause();
      videoOff.currentTime = 0;
    }
    current.classList.remove("is-active");
    index = (next + slides.length) % slides.length;
    const slide = slides[index];
    slide.classList.add("is-active");
    const video = slide.querySelector("video");
    if (video && !motion) {
      video.play().catch(() => {});
      window.clearTimeout(timer);
      timer = window.setTimeout(advance, 8000);
    } else {
      window.clearTimeout(timer);
      timer = window.setTimeout(advance, 5500);
    }
  };

  const advance = () => show(index + 1);

  if (!motion && slides.length > 1) {
    const first = slides[0].querySelector("video");
    if (first) first.play().catch(() => {});
    timer = window.setTimeout(advance, slides[0].querySelector("video") ? 8000 : 5500);
  }
}

const phoneErrors = {
  1: "L'indicatif du pays n'est pas reconnu.",
  2: "Ce numéro est trop court pour ce pays.",
  3: "Ce numéro est trop long pour ce pays.",
  4: "Ce numéro n'est pas valide.",
  5: "Ce numéro n'est pas valide.",
};

const initPhoneField = async () => {
  const input = document.querySelector("[data-intl-phone]");
  if (!input || !window.intlTelInput) return;
  let i18n = {};
  try {
    const locale = await import("https://cdn.jsdelivr.net/npm/intl-tel-input@25.3.1/build/js/i18n/fr/index.js");
    i18n = locale.default || {};
  } catch (error) {
    i18n = {};
  }
  window.intlTelInput(input, {
    initialCountry: "fr",
    countryOrder: ["fr", "tg"],
    separateDialCode: true,
    nationalMode: true,
    strictMode: true,
    i18n,
  });
  input.addEventListener("input", () => {
    input.classList.remove("is-invalid");
    const error = input.form?.querySelector("[data-phone-error]");
    if (error) error.hidden = true;
  });
};

const phoneReady = initPhoneField();

const phoneMessage = (iti, input) => {
  if (!input.value.trim()) return "Indiquez votre numéro de téléphone.";
  if (iti.isValidNumber()) return "";
  return phoneErrors[iti.getValidationError()] || "Ce numéro n'est pas valide pour le pays choisi.";
};

if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.querySelectorAll("video[autoplay]").forEach((video) => {
    video.removeAttribute("autoplay");
    video.pause();
  });
}

document.querySelectorAll("[data-whatsapp-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const phoneInput = form.querySelector("[data-intl-phone]");
    if (phoneInput && window.intlTelInput) {
      await phoneReady;
      const iti = window.intlTelInput.getInstance(phoneInput);
      const error = form.querySelector("[data-phone-error]");
      const message = iti ? phoneMessage(iti, phoneInput) : "Ce numéro n'est pas valide.";
      if (message) {
        phoneInput.classList.add("is-invalid");
        phoneInput.setAttribute("aria-invalid", "true");
        if (error) {
          error.hidden = false;
          error.textContent = message;
        }
        phoneInput.focus();
        return;
      }
      phoneInput.classList.remove("is-invalid");
      phoneInput.removeAttribute("aria-invalid");
      if (error) error.hidden = true;
      const full = form.querySelector("[data-phone-full]");
      if (full) full.value = iti.getNumber();
    }
    const button = form.querySelector("[type=submit]");
    const success = form.querySelector("[data-success]");
    const data = new FormData(form);
    const title = form.dataset.title || "Demande Multi Centrale Express";
    const fields = {};
    const lines = [title, ""];
    for (const [key, value] of data.entries()) {
      if (String(key).startsWith("_")) continue;
      const text = String(value).trim();
      if (!text) continue;
      fields[key] = text;
      lines.push(`${key} : ${text}`);
    }
    if (fields.Email) fields.email = fields.Email;
    const wa = `https://wa.me/33780807662?text=${encodeURIComponent(lines.join("\n"))}`;
    if (button) button.disabled = true;
    let emailed = false;
    try {
      const response = await fetch("https://formsubmit.co/ajax/wisdomkonou2020@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: title,
          _template: "box",
          _captcha: "false",
          ...fields,
        }),
      });
      emailed = response.ok;
    } catch (error) {
      emailed = false;
    }
    if (success) {
      success.hidden = false;
      success.textContent = emailed
        ? "C'est envoyé. Le message part par e-mail à wisdomkonou2020@gmail.com, et WhatsApp s'ouvre avec le même texte pour le téléphone."
        : "L'e-mail n'a pas pu partir. WhatsApp s'ouvre : envoyez le message pour qu'il arrive au +33 7 80 80 76 62.";
    }
    window.open(wa, "_blank", "noopener");
    if (button) button.disabled = false;
  });
});

const avisList = document.querySelector("[data-avis-list]");
const avisHome = document.querySelector("[data-avis-home]");
const avisForm = document.querySelector("[data-avis-form]");

const avisInitials = (name) => {
  const parts = String(name || "").trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0] || "").join("").toUpperCase() || "•";
};

const avisCard = (item) => {
  const article = document.createElement("article");
  article.className = "quote";
  const stars = document.createElement("div");
  stars.className = "stars";
  const note = Math.max(1, Math.min(5, Number(item.note) || 0));
  stars.textContent = "★".repeat(note) + "☆".repeat(5 - note);
  stars.setAttribute("aria-label", `${note} sur 5`);
  const text = document.createElement("p");
  text.textContent = `« ${item.message} »`;
  const who = document.createElement("div");
  who.className = "who";
  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = avisInitials(item.prenom);
  const meta = document.createElement("div");
  const name = document.createElement("b");
  name.textContent = item.prenom;
  meta.append(name);
  if (item.lieu) {
    const place = document.createElement("small");
    place.textContent = item.lieu;
    meta.append(place);
  }
  who.append(avatar, meta);
  article.append(stars, text, who);
  return article;
};

const paintAvis = (items) => {
  if (avisList) {
    avisList.replaceChildren(...items.map(avisCard));
    const empty = document.querySelector("[data-avis-empty]");
    if (empty) empty.hidden = items.length > 0;
  }
  if (avisHome && items.length) {
    avisHome.replaceChildren(...items.slice(0, 6).map(avisCard));
    const intro = document.querySelector("[data-avis-intro]");
    if (intro) intro.textContent = "Retours laissés sur la page Avis, après une expédition.";
  }
};

if (avisList || avisHome) {
  fetch("/api/reviews")
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => {
      if (!data || !Array.isArray(data.avis)) return;
      paintAvis(data.avis);
    })
    .catch(() => {});
}

if (avisForm) {
  const rate = avisForm.querySelector("[data-rate]");
  const stars = [...rate.querySelectorAll("[data-star]")];
  let note = 0;
  const paintStars = (value) => {
    stars.forEach((star) => {
      const on = Number(star.dataset.star) <= value;
      star.classList.toggle("is-on", on);
      star.setAttribute("aria-pressed", on ? "true" : "false");
    });
  };
  stars.forEach((star) => {
    star.addEventListener("click", () => {
      note = Number(star.dataset.star);
      paintStars(note);
    });
  });

  avisForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!avisForm.reportValidity()) return;
    const status = avisForm.querySelector("[data-avis-status]");
    const button = avisForm.querySelector("[type=submit]");
    const showStatus = (message, ok) => {
      status.hidden = false;
      status.textContent = message;
      status.classList.toggle("form-error", !ok);
      status.classList.toggle("success", ok);
    };
    if (!note) {
      showStatus("Choisissez une note.", false);
      return;
    }
    const payload = {
      prenom: avisForm.prenom.value,
      lieu: avisForm.lieu.value,
      message: avisForm.message.value,
      note,
      publication: avisForm.publication.checked,
      website: avisForm.website.value,
    };
    button.disabled = true;
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        showStatus(data.error || "L'avis n'a pas pu être publié.", false);
        button.disabled = false;
        return;
      }
      if (data.avis) {
        avisList.prepend(avisCard(data.avis));
        const empty = document.querySelector("[data-avis-empty]");
        if (empty) empty.hidden = true;
      }
      avisForm.reset();
      note = 0;
      paintStars(0);
      showStatus("C'est publié. Votre avis est visible sur cette page.", true);
    } catch (error) {
      showStatus("L'avis n'a pas pu être publié.", false);
    }
    button.disabled = false;
  });
}

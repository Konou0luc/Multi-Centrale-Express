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

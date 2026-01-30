import { buildAppUrl } from "./config.js";
import { logout } from "./auth.js";

const NAV_ITEMS = [
  {
    key: "auth",
    label: "ログイン／アカウント作成",
    href: "/auth/login.html",
    showWhen: "guest",
    type: "link",
  },
  { key: "learn", label: "学習", href: "/learn/index.html", type: "link" },
  { key: "history", label: "学習履歴", href: "/history/index.html", type: "link" },
  { key: "myphrase", label: "マイフレーズ", href: "/myphrase/index.html", type: "link" },
  { key: "ai", label: "AI解説", href: "/ai/index.html", type: "link" },
  { key: "profile", label: "プロフィール", href: "/profile/index.html", type: "link" },
  { key: "contact", label: "お問い合わせ", href: "/contact/index.html", type: "link" },
  {
    key: "logout",
    label: "ログアウト",
    showWhen: "auth",
    type: "action",
  },
];

function ensureLogoutModal() {
  let modal = document.getElementById("logout-modal");
  if (modal) {
    return modal;
  }

  modal = document.createElement("div");
  modal.id = "logout-modal";
  modal.className = "modal";
  modal.hidden = true;

  const card = document.createElement("div");
  card.className = "modal-card";

  const message = document.createElement("p");
  message.className = "page-subtitle";
  message.textContent = "ログアウトしますか？";

  const actions = document.createElement("div");
  actions.className = "modal-actions";

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className = "btn outline";
  cancelButton.textContent = "キャンセル";

  const confirmButton = document.createElement("button");
  confirmButton.type = "button";
  confirmButton.className = "btn danger";
  confirmButton.id = "logout-confirm";
  confirmButton.textContent = "ログアウト";

  actions.append(cancelButton, confirmButton);
  card.append(message, actions);
  modal.appendChild(card);
  document.body.appendChild(modal);

  cancelButton.addEventListener("click", () => {
    modal.hidden = true;
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.hidden = true;
    }
  });

  confirmButton.addEventListener("click", async () => {
    confirmButton.disabled = true;
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed", error);
    }
    window.location.href = buildAppUrl("/auth/login.html");
  });

  return modal;
}

function shouldShowNavItem(item, user, showAuth) {
  if (item.showWhen === "guest") {
    return !user && showAuth;
  }
  if (item.showWhen === "auth") {
    return Boolean(user);
  }
  return true;
}

export function renderHeader({ active, user, showAuth = true } = {}) {
  const header = document.getElementById("site-header");
  if (!header) {
    return;
  }

  header.textContent = "";
  header.className = "sidebar";

  const topRow = document.createElement("div");
  topRow.className = "sidebar-top";

  const brandLink = document.createElement("a");
  const brandTarget = user ? "/learn/index.html" : "/learn/guest.html";
  brandLink.href = buildAppUrl(brandTarget);
  brandLink.textContent = "KotobaRoots";
  brandLink.className = "sidebar-brand";

  const toggleButton = document.createElement("button");
  toggleButton.type = "button";
  toggleButton.className = "sidebar-toggle";
  toggleButton.textContent = "メニュー";
  toggleButton.setAttribute("aria-controls", "sidebar-nav");
  toggleButton.setAttribute("aria-expanded", "false");
  toggleButton.setAttribute("aria-label", "メニューを開閉");

  topRow.append(brandLink, toggleButton);
  header.appendChild(topRow);

  if (user) {
    const userInfo = document.createElement("div");
    userInfo.className = "sidebar-user";
    const username = user.username || "user";
    userInfo.textContent = `${username} でログイン中`;
    header.appendChild(userInfo);
  }

  const nav = document.createElement("nav");
  nav.className = "sidebar-nav";
  nav.id = "sidebar-nav";

  NAV_ITEMS.forEach((item) => {
    if (!shouldShowNavItem(item, user, showAuth)) {
      return;
    }
    if (item.type === "action") {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "nav-item logout-item";
      button.textContent = item.label;
      button.addEventListener("click", async () => {
        const modal = ensureLogoutModal();
        const confirmButton = modal.querySelector("#logout-confirm");
        if (confirmButton instanceof HTMLButtonElement) {
          confirmButton.disabled = false;
        }
        modal.hidden = false;
      });
      nav.appendChild(button);
      return;
    }

    const link = document.createElement("a");
    const isGuestShortcut = item.key === "auth";
    let targetHref = item.href;
    if (!user && showAuth && item.key === "learn") {
      targetHref = "/learn/guest.html";
    } else if (!user && showAuth && !isGuestShortcut) {
      targetHref = `/auth/login.html?next=${encodeURIComponent(item.href)}`;
    }
    link.href = buildAppUrl(targetHref);
    link.textContent = item.label;
    link.className = "nav-item";
    if (item.key === "auth") {
      link.classList.add("auth-item");
      link.classList.add("login-item");
    }
    if (active === item.key) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
    nav.appendChild(link);
  });

  header.appendChild(nav);

  const authLink = nav.querySelector(".auth-item");
  if (authLink) {
    const updateAuthLabel = () => {
      authLink.classList.remove("is-multiline");
      authLink.textContent = "ログイン／アカウント作成";
      authLink.style.whiteSpace = "nowrap";
      const needsWrap = authLink.scrollWidth > authLink.clientWidth + 1;
      if (needsWrap) {
        authLink.textContent = "ログイン\nアカウント作成";
        authLink.classList.add("is-multiline");
        authLink.style.whiteSpace = "";
      }
    };
    const scheduleUpdate = () => requestAnimationFrame(updateAuthLabel);
    scheduleUpdate();
    window.addEventListener("resize", scheduleUpdate);
  }

  toggleButton.addEventListener("click", () => {
    const isOpen = header.classList.toggle("is-open");
    toggleButton.setAttribute("aria-expanded", String(isOpen));
  });

  nav.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const clicked = target.closest("a,button");
    if (!clicked) {
      return;
    }
    if (window.matchMedia("(max-width: 880px)").matches) {
      header.classList.remove("is-open");
      toggleButton.setAttribute("aria-expanded", "false");
    }
  });
}

export function setStatus(element, { type = "info", message = "" } = {}) {
  if (!element) {
    return;
  }
  element.textContent = message;
  element.className = `status ${type}`.trim();
  element.hidden = !message;
}

export function formatDate(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("ja-JP");
}


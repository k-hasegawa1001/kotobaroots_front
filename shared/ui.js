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

  const brandLink = document.createElement("a");
  brandLink.href = buildAppUrl("/learn/index.html");
  brandLink.textContent = "KotobaRoots";
  brandLink.className = "sidebar-brand";

  header.appendChild(brandLink);

  if (user) {
    const userInfo = document.createElement("div");
    userInfo.className = "sidebar-user";
    const username = user.username || "user";
    userInfo.textContent = `${username} でログイン中`;
    header.appendChild(userInfo);
  }

  const nav = document.createElement("nav");
  nav.className = "sidebar-nav";

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
        try {
          await logout();
        } catch (error) {
          // Continue to login screen even when logout fails.
        }
        window.location.href = buildAppUrl("/auth/login.html");
      });
      nav.appendChild(button);
      return;
    }

    const link = document.createElement("a");
    const isGuestShortcut = item.key === "auth";
    const targetHref = !user && showAuth && !isGuestShortcut
      ? `/auth/login.html?next=${encodeURIComponent(item.href)}`
      : item.href;
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

export const NAV_ITEMS = [
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

export function getNavItems({ user, showAuth = true } = {}) {
  return NAV_ITEMS.filter((item) => shouldShowNavItem(item, user, showAuth));
}

export function resolveNavHref({ item, user, showAuth = true } = {}) {
  const isGuestShortcut = item.key === "auth";
  if (!user && showAuth && item.key === "learn") {
    return "/learn/guest.html";
  }
  if (!user && showAuth && !isGuestShortcut) {
    return `/auth/login.html?next=${encodeURIComponent(item.href)}`;
  }
  return item.href;
}

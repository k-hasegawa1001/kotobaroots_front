document.addEventListener("DOMContentLoaded", () => {
  // --- 1. ログインボタンの処理 ---
  // HTMLのクラス名 .login-btn を使って特定します（順番が変わっても大丈夫になります）
  const menuItemElms = document.querySelectorAll(".menu-item");

  menuItemElms.forEach((item) => {
    item.addEventListener("click", () => {
      // ログイン/新規登録ページへ
      window.location.href = "./login.html";
    });
  });
});

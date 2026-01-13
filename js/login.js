document.addEventListener("DOMContentLoaded", () => {
  // --- 設定 ---
  const IS_MOCK_MODE = false;
  const API_URL = "http://127.0.0.1:5000/api/auth/login";

  // --- 要素の取得 ---
  const loginForm = document.querySelector("form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  // エラーメッセージ表示場所
  let errorMsgArea = document.getElementById("error-message");
  if (!errorMsgArea) {
    errorMsgArea = document.createElement("p");
    errorMsgArea.style.color = "red";
    errorMsgArea.style.fontSize = "0.9rem";
    errorMsgArea.style.minHeight = "1.5em";
    const submitBtn = document.querySelector('button[type="submit"]');
    submitBtn.parentNode.insertBefore(errorMsgArea, submitBtn);
  }

  // --- フォーム送信時の処理 ---
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMsgArea.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // 1. バリデーション
    if (!email || !password) {
      showError("メールアドレスとパスワードを入力してください");
      return;
    }

    // 2. ログイン処理
    try {
      if (IS_MOCK_MODE) {
        console.log("モックモード: 成功として処理");
        handleLoginSuccess({ username: "Test User" });
      } else {
        await loginWithApi(email, password);
      }
    } catch (error) {
      console.error("Login Error:", error);
      showError("通信エラーが発生しました。サーバーの状態を確認してください。");
    }
  });

  // --- 関数定義 ---

  function showError(msg) {
    errorMsgArea.textContent = msg;
  }

  async function loginWithApi(email, password) {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // 重要: Flask-LoginのセッションCookieをブラウザに保存させるために必要
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    // レスポンスのJSONを取得（エラーメッセージなどが含まれる可能性があるため）
    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      // ステータスコードが200番台なら成功とみなす
      // data.access_token のチェックは不要になりました
      handleLoginSuccess(data);
    } else {
      // 認証失敗 (Flask-Loginで 401 Unauthorized などが返る場合)
      showError(data.msg || data.message || "メールアドレスかパスワードが間違っています");
    }
  }

  function handleLoginSuccess(data) {
    // トークンの保存処理(localStorage.setItem)は削除しました

    // ユーザー名など、表示に使いたい情報があれば保存してもOKですが、
    // 認証自体はCookieで行われるので必須ではありません。
    if (data.user_info) {
      localStorage.setItem("user_info", JSON.stringify(data.user_info));
    }

    // 画面遷移
    window.location.href = "./login_index.html";
  }
});

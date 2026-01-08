document.addEventListener("DOMContentLoaded", () => {
  // --- 設定 ---
  // trueにすると、APIを叩かずに「成功」として扱います（サーバーが落ちている時のテスト用）
  // TODO:本番環境ではfalseにしておく
  const IS_MOCK_MODE = false;

  // --- 要素の取得 ---
  const loginForm = document.querySelector("form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  // エラーメッセージ表示場所（HTMLになければJSで作ってボタンの前に挿入）
  let errorMsgArea = document.getElementById("error-message");
  if (!errorMsgArea) {
    errorMsgArea = document.createElement("p");
    errorMsgArea.style.color = "red";
    errorMsgArea.style.fontSize = "0.9rem";
    const submitBtn = document.querySelector('button[type="submit"]');
    submitBtn.parentNode.insertBefore(errorMsgArea, submitBtn);
  }

  // --- フォーム送信時の処理 ---
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // 本来のフォーム送信（画面リロード）を止める
    errorMsgArea.textContent = ""; // エラーメッセージをリセット

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // 1. バリデーション（入力チェック）
    if (!email || !password) {
      showError("メールアドレスとパスワードを入力してください");
      return;
    }

    if (!isValidEmail(email)) {
      showError("メールアドレスの形式が正しくありません");
      return;
    }

    // 2. ログイン処理
    try {
      if (IS_MOCK_MODE) {
        // --- テスト用（APIを叩かない） ---
        console.log("モックモード: ログイン成功として処理します");
        handleLoginSuccess({ access_token: "dummy_token", user_info: { username: "Test User", email: "test@example.com" } });
      } else {
        // --- 本番用（APIを叩く） ---
        await loginWithApi(email, password);
      }
    } catch (error) {
      console.error("Login Error:", error);
      showError("通信エラーが発生しました。サーバーの状態を確認してください。");
    }
  });

  // --- 関数定義 ---

  // メールアドレスの形式チェック
  function isValidEmail(email) {
    // 簡易的な正規表現
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  // エラーメッセージ表示
  function showError(msg) {
    errorMsgArea.textContent = msg;
  }

  // API通信処理
  async function loginWithApi(email, password) {
    // Flaskのエンドポイント
    // TODO: 本番環境のURLに書き換えてください
    const API_URL = "http://127.0.0.1:5000/api/auth/login";

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email, password: password }),
    });

    const data = await response.json();

    // Flask側が失敗時も200を返し、{"msg": "..."} を送ってくる仕様への対応
    if (data.access_token) {
      // アクセストークンがあれば成功
      handleLoginSuccess(data);
    } else if (data.msg) {
      // msgプロパティがあれば失敗（"メールアドレスかパスワードが間違っています"など）
      showError(data.msg);
    } else {
      // 予期せぬエラー
      showError("不明なエラーが発生しました");
    }
  }

  // ログイン成功時の共通処理
  function handleLoginSuccess(data) {
    // 1. トークンを保存 (localStorage推奨)
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("user_info", JSON.stringify(data.user_info));

    // 2. 画面遷移
    // ログイン後のトップページURL（適宜書き換えてください）
    window.location.href = "./login_index.html";
  }
});

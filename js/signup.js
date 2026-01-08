document.addEventListener("DOMContentLoaded", () => {
  // --- 設定 ---
  const IS_MOCK_MODE = false; // サーバー停止時のUIテスト用
  // バックエンドのURL (5000/5001問題に対応するためポートは環境に合わせてください)
  // TODO:本番環境では適切なURLに変更してください
  const API_URL = "http://127.0.0.1:5000/api/auth/create-user";

  // --- 要素の取得 ---
  const signupForm = document.querySelector("form");
  const usernameInput = document.getElementById("username");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirm-password");
  const submitButton = document.querySelector('button[type="submit"]');

  // エラーメッセージ表示エリアの作成（login.jsと同様）
  //   let errorMsgArea = document.createElement("p");
  //   errorMsgArea.style.color = "red";
  //   errorMsgArea.style.fontSize = "0.9rem";
  //   errorMsgArea.style.marginBottom = "10px";
  //   // ボタンの直前に挿入
  //   submitButton.parentNode.insertBefore(errorMsgArea, submitButton);
  let errorMsgArea = document.getElementById("error-message");
  if (!errorMsgArea) {
    errorMsgArea = document.createElement("p");
    errorMsgArea.style.color = "red";
    errorMsgArea.style.fontSize = "0.9rem";
    const submitBtn = document.querySelector('button[type="submit"]');
    submitBtn.parentNode.insertBefore(errorMsgArea, submitBtn);
  }

  // --- フォーム送信時の処理 ---
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMsgArea.textContent = ""; // エラーリセット

    // 1. 入力値の取得
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // 2. クライアントサイド・バリデーション
    if (!username || !email || !password || !confirmPassword) {
      showError("全ての項目を入力してください");
      return;
    }

    if (!isValidEmail(email)) {
      showError("メールアドレスの形式が正しくありません");
      return;
    }

    if (password.length < 8 || password.length > 16) {
      showError("パスワードは8文字以上16文字以下にしてください");
      return;
    }

    if (password !== confirmPassword) {
      showError("パスワードと確認用パスワードが一致しません");
      return;
    }

    // 3. API通信処理
    toggleLoading(true); // ボタンを無効化（連打防止）

    try {
      if (IS_MOCK_MODE) {
        // --- モックモード ---
        console.log("モック: 新規登録成功");
        await new Promise((r) => setTimeout(r, 1000)); // 擬似的な待ち時間
        handleSuccess();
      } else {
        // --- 本番モード ---
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username,
            email: email,
            password: password,
            // confirm_password はバックエンドに送る必要がないので除外
          }),
        });

        const data = await response.json();

        if (response.ok) {
          handleSuccess();
        } else {
          // エラー処理 (例: メールアドレスが既に使われている場合など)
          // バックエンドが Exception の内容を返してくる場合、ユーザーに見せるには少し整形が必要かもしれません
          // 現状はそのまま表示するか、汎用的なメッセージにします
          console.error("Server Error:", data);

          if (data.error && data.error.includes("UNIQUE constraint failed")) {
            showError("このメールアドレスは既に登録されています");
          } else {
            showError("登録に失敗しました: " + (data.msg || data.error || "不明なエラー"));
          }
        }
      }
    } catch (error) {
      console.error("Network Error:", error);
      showError("通信エラーが発生しました。サーバーの状態を確認してください。");
    } finally {
      toggleLoading(false); // ボタンを有効化
    }
  });

  // --- 補助関数 ---

  function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  function showError(msg) {
    errorMsgArea.textContent = msg;
  }

  // ボタンのローディング制御
  function toggleLoading(isLoading) {
    if (isLoading) {
      submitButton.disabled = true;
      submitButton.textContent = "処理中...";
      submitButton.style.opacity = "0.7";
    } else {
      submitButton.disabled = false;
      submitButton.textContent = "アカウント作成";
      submitButton.style.opacity = "1";
    }
  }

  // 登録成功時の処理
  function handleSuccess() {
    alert("アカウントを作成しました！\nログイン画面へ移動します。");
    window.location.href = "./login.html";
  }
});

document.addEventListener("DOMContentLoaded", () => {
  // --- 設定 ---
  const API_URL = "http://127.0.0.1:5000/api/kotobaroots/learning";

  // DBが空の間のテスト用データ (APIレスポンスのふりをする)
  const MOCK_TOPICS = [
    { id: 1, topic: "自己紹介", difficulty: 1 },
    { id: 2, topic: "レストランでの注文", difficulty: 1 },
    { id: 3, topic: "道案内", difficulty: 2 },
    { id: 4, topic: "ホテルのチェックイン", difficulty: 2 },
    { id: 5, topic: "緊急時の対応", difficulty: 3 },
    { id: 6, topic: "日常会話", difficulty: 1 },
  ];

  // --- 1. 認証チェック ---
  const token = localStorage.getItem("access_token");
  const userInfoStr = localStorage.getItem("user_info");

  if (!token || !userInfoStr) {
    // トークンがない場合はログイン画面へ強制送還
    window.location.href = "./login.html";
    return;
  }

  // --- 2. ユーザー名の表示 ---
  const userInfo = JSON.parse(userInfoStr);
  const usernameSpan = document.getElementById("username");
  if (usernameSpan) {
    usernameSpan.textContent = userInfo.username;
  }

  // --- 3. 学習トピックの取得と表示 ---
  fetchLearningTopics();

  async function fetchLearningTopics() {
    const container = document.getElementById("learning-topics-container");
    if (!container) return; // HTMLにコンテナがない場合は何もしない

    // ロード中表示（必要なら）
    container.innerHTML = '<p style="color:white;">読み込み中...</p>';

    try {
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // JWTトークンをヘッダーに付与
        },
      });

      if (response.status === 401) {
        // トークン期限切れなどの場合
        alert("セッションが切れました。再度ログインしてください。");
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error("API Error");
      }

      const data = await response.json();

      // APIからデータが返ってきたらそれを使い、空ならモックデータを使う
      // ※ backendの実装に合わせて調整してください (例: data.topics なのか data そのものなのか)
      const topics = data && data.length > 0 ? data : MOCK_TOPICS;

      renderTopics(topics, container);
    } catch (error) {
      console.error("Fetch error:", error);
      // エラー時も開発用にモックを表示してしまう（本番では消す）
      console.log("API接続に失敗したため、モックデータを表示します");
      renderTopics(MOCK_TOPICS, container);
    }
  }

  // --- 4. 画面描画ロジック ---
  function renderTopics(topics, container) {
    container.innerHTML = ""; // 中身をクリア

    topics.forEach((item) => {
      // カードのHTMLを作成
      const card = document.createElement("div");
      card.className = "topic-card";

      // カードの中身
      card.innerHTML = `
                <h3 class="topic-title">${item.topic}</h3>
                <div class="topic-info">
                    <span class="difficulty-stars">${"★".repeat(item.difficulty)}</span>
                </div>
            `;

      // クリック時の動作（学習開始ページへ遷移など）
      card.addEventListener("click", () => {
        console.log(`Topic ID ${item.id} clicked`);
        // window.location.href = `learning_session.html?topic_id=${item.id}`;
      });

      container.appendChild(card);
    });
  }

  // --- 5. ログアウト処理 ---
  // (HTMLにログアウトボタンを追加したら機能します)
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_info");
    window.location.href = "./not_login_index.html"; // 未ログインTopへ
  }
});

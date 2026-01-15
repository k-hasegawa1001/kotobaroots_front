document.addEventListener("DOMContentLoaded", () => {
  // --- 險ｭ螳・---
  const API_URL = "http://127.0.0.1:5000/api/kotobaroots/learning";

  // DB縺檎ｩｺ縺ｮ髢薙・繝・せ繝育畑繝・・繧ｿ (API繝ｬ繧ｹ繝昴Φ繧ｹ縺ｮ縺ｵ繧翫ｒ縺吶ｋ)
  const MOCK_TOPICS = [
    { id: 1, topic: "閾ｪ蟾ｱ邏ｹ莉・, difficulty: 1 },
    { id: 2, topic: "繝ｬ繧ｹ繝医Λ繝ｳ縺ｧ縺ｮ豕ｨ譁・, difficulty: 1 },
    { id: 3, topic: "驕捺｡亥・", difficulty: 2 },
    { id: 4, topic: "繝帙ユ繝ｫ縺ｮ繝√ぉ繝・け繧､繝ｳ", difficulty: 2 },
    { id: 5, topic: "邱頑･譎ゅ・蟇ｾ蠢・, difficulty: 3 },
    { id: 6, topic: "譌･蟶ｸ莨夊ｩｱ", difficulty: 1 },
  ];

  // --- 1. 隱崎ｨｼ繝√ぉ繝・け ---
  const token = localStorage.getItem("access_token");
  const userInfoStr = localStorage.getItem("user_info");

  if (!token || !userInfoStr) {
    // 繝医・繧ｯ繝ｳ縺後↑縺・ｴ蜷医・繝ｭ繧ｰ繧､繝ｳ逕ｻ髱｢縺ｸ蠑ｷ蛻ｶ騾・ｄ
    window.location.href = "./login.html";
    return;
  }

  // --- 2. 繝ｦ繝ｼ繧ｶ繝ｼ蜷阪・陦ｨ遉ｺ ---
  const userInfo = JSON.parse(userInfoStr);
  const usernameSpan = document.getElementById("username");
  if (usernameSpan) {
    usernameSpan.textContent = userInfo.username;
  }

  // --- 3. 蟄ｦ鄙偵ヨ繝斐ャ繧ｯ縺ｮ蜿門ｾ励→陦ｨ遉ｺ ---
  fetchLearningTopics();

  async function fetchLearningTopics() {
    const container = document.getElementById("learning-topics-container");
    if (!container) return; // HTML縺ｫ繧ｳ繝ｳ繝・リ縺後↑縺・ｴ蜷医・菴輔ｂ縺励↑縺・

    // 繝ｭ繝ｼ繝我ｸｭ陦ｨ遉ｺ・亥ｿ・ｦ√↑繧会ｼ・
    container.innerHTML = '<p style="color:white;">隱ｭ縺ｿ霎ｼ縺ｿ荳ｭ...</p>';

    try {
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // JWT繝医・繧ｯ繝ｳ繧偵・繝・ム繝ｼ縺ｫ莉倅ｸ・
        },
      });

      if (response.status === 401) {
        // 繝医・繧ｯ繝ｳ譛滄剞蛻・ｌ縺ｪ縺ｩ縺ｮ蝣ｴ蜷・
        alert("繧ｻ繝・す繝ｧ繝ｳ縺悟・繧後∪縺励◆縲ょ・蠎ｦ繝ｭ繧ｰ繧､繝ｳ縺励※縺上□縺輔＞縲・);
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error("API Error");
      }

      const data = await response.json();

      // API縺九ｉ繝・・繧ｿ縺瑚ｿ斐▲縺ｦ縺阪◆繧峨◎繧後ｒ菴ｿ縺・∫ｩｺ縺ｪ繧峨Δ繝・け繝・・繧ｿ繧剃ｽｿ縺・
      // 窶ｻ backend縺ｮ螳溯｣・↓蜷医ｏ縺帙※隱ｿ謨ｴ縺励※縺上□縺輔＞ (萓・ data.topics 縺ｪ縺ｮ縺・data 縺昴・繧ゅ・縺ｪ縺ｮ縺・
      const topics = data && data.length > 0 ? data : MOCK_TOPICS;

      renderTopics(topics, container);
    } catch (error) {
      console.error("Fetch error:", error);
      // 繧ｨ繝ｩ繝ｼ譎ゅｂ髢狗匱逕ｨ縺ｫ繝｢繝・け繧定｡ｨ遉ｺ縺励※縺励∪縺・ｼ域悽逡ｪ縺ｧ縺ｯ豸医☆・・
      console.log("API謗･邯壹↓螟ｱ謨励＠縺溘◆繧√√Δ繝・け繝・・繧ｿ繧定｡ｨ遉ｺ縺励∪縺・);
      renderTopics(MOCK_TOPICS, container);
    }
  }

  // --- 4. 逕ｻ髱｢謠冗判繝ｭ繧ｸ繝・け ---
  function renderTopics(topics, container) {
    container.innerHTML = ""; // 荳ｭ霄ｫ繧偵け繝ｪ繧｢

    topics.forEach((item) => {
      // 繧ｫ繝ｼ繝峨・HTML繧剃ｽ懈・
      const card = document.createElement("div");
      card.className = "topic-card";

      // 繧ｫ繝ｼ繝峨・荳ｭ霄ｫ
      card.innerHTML = `
                <h3 class="topic-title">${item.topic}</h3>
                <div class="topic-info">
                    <span class="difficulty-stars">${"笘・.repeat(item.difficulty)}</span>
                </div>
            `;

      // 繧ｯ繝ｪ繝・け譎ゅ・蜍穂ｽ懶ｼ亥ｭｦ鄙帝幕蟋九・繝ｼ繧ｸ縺ｸ驕ｷ遘ｻ縺ｪ縺ｩ・・
      card.addEventListener("click", () => {
        console.log(`Topic ID ${item.id} clicked`);
        // window.location.href = `learning_session.html?topic_id=${item.id}`;
      });

      container.appendChild(card);
    });
  }

  // --- 5. 繝ｭ繧ｰ繧｢繧ｦ繝亥・逅・---
  // (HTML縺ｫ繝ｭ繧ｰ繧｢繧ｦ繝医・繧ｿ繝ｳ繧定ｿｽ蜉縺励◆繧画ｩ溯・縺励∪縺・
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_info");
    window.location.href = "./not_login_index.html"; // 譛ｪ繝ｭ繧ｰ繧､繝ｳTop縺ｸ
  }
});

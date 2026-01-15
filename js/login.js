document.addEventListener("DOMContentLoaded", () => {
  // --- 險ｭ螳・---
  const IS_MOCK_MODE = false;
  const API_URL = "http://127.0.0.1:5000/api/auth/login";

  // --- 隕∫ｴ縺ｮ蜿門ｾ・---
  const loginForm = document.querySelector("form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  // 繧ｨ繝ｩ繝ｼ繝｡繝・そ繝ｼ繧ｸ陦ｨ遉ｺ蝣ｴ謇
  let errorMsgArea = document.getElementById("error-message");
  if (!errorMsgArea) {
    errorMsgArea = document.createElement("p");
    errorMsgArea.style.color = "red";
    errorMsgArea.style.fontSize = "0.9rem";
    errorMsgArea.style.minHeight = "1.5em";
    const submitBtn = document.querySelector('button[type="submit"]');
    submitBtn.parentNode.insertBefore(errorMsgArea, submitBtn);
  }

  // --- 繝輔か繝ｼ繝騾∽ｿ｡譎ゅ・蜃ｦ逅・---
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMsgArea.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // 1. 繝舌Μ繝・・繧ｷ繝ｧ繝ｳ
    if (!email || !password) {
      showError("繝｡繝ｼ繝ｫ繧｢繝峨Ξ繧ｹ縺ｨ繝代せ繝ｯ繝ｼ繝峨ｒ蜈･蜉帙＠縺ｦ縺上□縺輔＞");
      return;
    }

    // 2. 繝ｭ繧ｰ繧､繝ｳ蜃ｦ逅・
    try {
      if (IS_MOCK_MODE) {
        console.log("繝｢繝・け繝｢繝ｼ繝・ 謌仙粥縺ｨ縺励※蜃ｦ逅・);
        handleLoginSuccess({ username: "Test User" });
      } else {
        await loginWithApi(email, password);
      }
    } catch (error) {
      console.error("Login Error:", error);
      showError("騾壻ｿ｡繧ｨ繝ｩ繝ｼ縺檎匱逕溘＠縺ｾ縺励◆縲ゅし繝ｼ繝舌・縺ｮ迥ｶ諷九ｒ遒ｺ隱阪＠縺ｦ縺上□縺輔＞縲・);
    }
  });

  // --- 髢｢謨ｰ螳夂ｾｩ ---

  function showError(msg) {
    errorMsgArea.textContent = msg;
  }

  async function loginWithApi(email, password) {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // 驥崎ｦ・ Flask-Login縺ｮ繧ｻ繝・す繝ｧ繝ｳCookie繧偵ヶ繝ｩ繧ｦ繧ｶ縺ｫ菫晏ｭ倥＆縺帙ｋ縺溘ａ縺ｫ蠢・ｦ・
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    // 繝ｬ繧ｹ繝昴Φ繧ｹ縺ｮJSON繧貞叙蠕暦ｼ医お繝ｩ繝ｼ繝｡繝・そ繝ｼ繧ｸ縺ｪ縺ｩ縺悟性縺ｾ繧後ｋ蜿ｯ閭ｽ諤ｧ縺後≠繧九◆繧・ｼ・
    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      // 繧ｹ繝・・繧ｿ繧ｹ繧ｳ繝ｼ繝峨′200逡ｪ蜿ｰ縺ｪ繧画・蜉溘→縺ｿ縺ｪ縺・
      // data.access_token 縺ｮ繝√ぉ繝・け縺ｯ荳崎ｦ√↓縺ｪ繧翫∪縺励◆
      console.log("繝ｭ繧ｰ繧､繝ｳ謌仙粥");
      handleLoginSuccess(data);
    } else {
      // 隱崎ｨｼ螟ｱ謨・(Flask-Login縺ｧ 401 Unauthorized 縺ｪ縺ｩ縺瑚ｿ斐ｋ蝣ｴ蜷・
      showError(data.msg || data.message || "繝｡繝ｼ繝ｫ繧｢繝峨Ξ繧ｹ縺九ヱ繧ｹ繝ｯ繝ｼ繝峨′髢馴＆縺｣縺ｦ縺・∪縺・);
    }
  }

  function handleLoginSuccess(data) {
    // 繝医・繧ｯ繝ｳ縺ｮ菫晏ｭ伜・逅・localStorage.setItem)縺ｯ蜑企勁縺励∪縺励◆

    // 繝ｦ繝ｼ繧ｶ繝ｼ蜷阪↑縺ｩ縲∬｡ｨ遉ｺ縺ｫ菴ｿ縺・◆縺・ュ蝣ｱ縺後≠繧後・菫晏ｭ倥＠縺ｦ繧０K縺ｧ縺吶′縲・
    // 隱崎ｨｼ閾ｪ菴薙・Cookie縺ｧ陦後ｏ繧後ｋ縺ｮ縺ｧ蠢・医〒縺ｯ縺ゅｊ縺ｾ縺帙ｓ縲・
    if (data.user_info) {
      localStorage.setItem("user_info", JSON.stringify(data.user_info));
    }

    // 逕ｻ髱｢驕ｷ遘ｻ
    window.location.href = "./login_index.html";
  }
});

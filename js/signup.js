document.addEventListener("DOMContentLoaded", () => {
  // --- 險ｭ螳・---
  const IS_MOCK_MODE = false; // 繧ｵ繝ｼ繝舌・蛛懈ｭ｢譎ゅ・UI繝・せ繝育畑
  // 繝舌ャ繧ｯ繧ｨ繝ｳ繝峨・URL (5000/5001蝠城｡後↓蟇ｾ蠢懊☆繧九◆繧√・繝ｼ繝医・迺ｰ蠅・↓蜷医ｏ縺帙※縺上□縺輔＞)
  // TODO:譛ｬ逡ｪ迺ｰ蠅・〒縺ｯ驕ｩ蛻・↑URL縺ｫ螟画峩縺励※縺上□縺輔＞
  const API_URL = "http://127.0.0.1:5000/api/auth/create-user";

  // --- 隕∫ｴ縺ｮ蜿門ｾ・---
  const signupForm = document.querySelector("form");
  const usernameInput = document.getElementById("username");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirm-password");
  const submitButton = document.querySelector('button[type="submit"]');

  // 繧ｨ繝ｩ繝ｼ繝｡繝・そ繝ｼ繧ｸ陦ｨ遉ｺ繧ｨ繝ｪ繧｢縺ｮ菴懈・・・ogin.js縺ｨ蜷梧ｧ假ｼ・
  //   let errorMsgArea = document.createElement("p");
  //   errorMsgArea.style.color = "red";
  //   errorMsgArea.style.fontSize = "0.9rem";
  //   errorMsgArea.style.marginBottom = "10px";
  //   // 繝懊ち繝ｳ縺ｮ逶ｴ蜑阪↓謖ｿ蜈･
  //   submitButton.parentNode.insertBefore(errorMsgArea, submitButton);
  let errorMsgArea = document.getElementById("error-message");
  if (!errorMsgArea) {
    errorMsgArea = document.createElement("p");
    errorMsgArea.style.color = "red";
    errorMsgArea.style.fontSize = "0.9rem";
    const submitBtn = document.querySelector('button[type="submit"]');
    submitBtn.parentNode.insertBefore(errorMsgArea, submitBtn);
  }

  // --- 繝輔か繝ｼ繝騾∽ｿ｡譎ゅ・蜃ｦ逅・---
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMsgArea.textContent = ""; // 繧ｨ繝ｩ繝ｼ繝ｪ繧ｻ繝・ヨ

    // 1. 蜈･蜉帛､縺ｮ蜿門ｾ・
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // 2. 繧ｯ繝ｩ繧､繧｢繝ｳ繝医し繧､繝峨・繝舌Μ繝・・繧ｷ繝ｧ繝ｳ
    if (!username || !email || !password || !confirmPassword) {
      showError("蜈ｨ縺ｦ縺ｮ鬆・岼繧貞・蜉帙＠縺ｦ縺上□縺輔＞");
      return;
    }

    if (!isValidEmail(email)) {
      showError("繝｡繝ｼ繝ｫ繧｢繝峨Ξ繧ｹ縺ｮ蠖｢蠑上′豁｣縺励￥縺ゅｊ縺ｾ縺帙ｓ");
      return;
    }

    if (password.length < 8 || password.length > 16) {
      showError("繝代せ繝ｯ繝ｼ繝峨・8譁・ｭ嶺ｻ･荳・6譁・ｭ嶺ｻ･荳九↓縺励※縺上□縺輔＞");
      return;
    }

    if (password !== confirmPassword) {
      showError("繝代せ繝ｯ繝ｼ繝峨→遒ｺ隱咲畑繝代せ繝ｯ繝ｼ繝峨′荳閾ｴ縺励∪縺帙ｓ");
      return;
    }

    // 3. API騾壻ｿ｡蜃ｦ逅・
    toggleLoading(true); // 繝懊ち繝ｳ繧堤┌蜉ｹ蛹厄ｼ磯｣謇馴亟豁｢・・

    try {
      if (IS_MOCK_MODE) {
        // --- 繝｢繝・け繝｢繝ｼ繝・---
        console.log("繝｢繝・け: 譁ｰ隕冗匳骭ｲ謌仙粥");
        await new Promise((r) => setTimeout(r, 1000)); // 謫ｬ莨ｼ逧・↑蠕・■譎る俣
        handleSuccess();
      } else {
        // --- 譛ｬ逡ｪ繝｢繝ｼ繝・---
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username,
            email: email,
            password: password,
            // confirm_password 縺ｯ繝舌ャ繧ｯ繧ｨ繝ｳ繝峨↓騾√ｋ蠢・ｦ√′縺ｪ縺・・縺ｧ髯､螟・
          }),
        });

        const data = await response.json();

        if (response.ok) {
          handleSuccess();
        } else {
          // 繧ｨ繝ｩ繝ｼ蜃ｦ逅・(萓・ 繝｡繝ｼ繝ｫ繧｢繝峨Ξ繧ｹ縺梧里縺ｫ菴ｿ繧上ｌ縺ｦ縺・ｋ蝣ｴ蜷医↑縺ｩ)
          // 繝舌ャ繧ｯ繧ｨ繝ｳ繝峨′ Exception 縺ｮ蜀・ｮｹ繧定ｿ斐＠縺ｦ縺上ｋ蝣ｴ蜷医√Θ繝ｼ繧ｶ繝ｼ縺ｫ隕九○繧九↓縺ｯ蟆代＠謨ｴ蠖｢縺悟ｿ・ｦ√°繧ゅ＠繧後∪縺帙ｓ
          // 迴ｾ迥ｶ縺ｯ縺昴・縺ｾ縺ｾ陦ｨ遉ｺ縺吶ｋ縺九∵ｱ守畑逧・↑繝｡繝・そ繝ｼ繧ｸ縺ｫ縺励∪縺・
          console.error("Server Error:", data);

          if (data.error && data.error.includes("UNIQUE constraint failed")) {
            showError("縺薙・繝｡繝ｼ繝ｫ繧｢繝峨Ξ繧ｹ縺ｯ譌｢縺ｫ逋ｻ骭ｲ縺輔ｌ縺ｦ縺・∪縺・);
          } else {
            showError("逋ｻ骭ｲ縺ｫ螟ｱ謨励＠縺ｾ縺励◆: " + (data.msg || data.error || "荳肴・縺ｪ繧ｨ繝ｩ繝ｼ"));
          }
        }
      }
    } catch (error) {
      console.error("Network Error:", error);
      showError("騾壻ｿ｡繧ｨ繝ｩ繝ｼ縺檎匱逕溘＠縺ｾ縺励◆縲ゅし繝ｼ繝舌・縺ｮ迥ｶ諷九ｒ遒ｺ隱阪＠縺ｦ縺上□縺輔＞縲・);
    } finally {
      toggleLoading(false); // 繝懊ち繝ｳ繧呈怏蜉ｹ蛹・
    }
  });

  // --- 陬懷勧髢｢謨ｰ ---

  function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  function showError(msg) {
    errorMsgArea.textContent = msg;
  }

  // 繝懊ち繝ｳ縺ｮ繝ｭ繝ｼ繝・ぅ繝ｳ繧ｰ蛻ｶ蠕｡
  function toggleLoading(isLoading) {
    if (isLoading) {
      submitButton.disabled = true;
      submitButton.textContent = "蜃ｦ逅・ｸｭ...";
      submitButton.style.opacity = "0.7";
    } else {
      submitButton.disabled = false;
      submitButton.textContent = "繧｢繧ｫ繧ｦ繝ｳ繝井ｽ懈・";
      submitButton.style.opacity = "1";
    }
  }

  // 逋ｻ骭ｲ謌仙粥譎ゅ・蜃ｦ逅・
  function handleSuccess() {
    alert("繧｢繧ｫ繧ｦ繝ｳ繝医ｒ菴懈・縺励∪縺励◆・―n繝ｭ繧ｰ繧､繝ｳ逕ｻ髱｢縺ｸ遘ｻ蜍輔＠縺ｾ縺吶・);
    window.location.href = "./login.html";
  }
});

document.addEventListener("DOMContentLoaded", () => {
  // --- 1. 繝ｭ繧ｰ繧､繝ｳ繝懊ち繝ｳ縺ｮ蜃ｦ逅・---
  // HTML縺ｮ繧ｯ繝ｩ繧ｹ蜷・.login-btn 繧剃ｽｿ縺｣縺ｦ迚ｹ螳壹＠縺ｾ縺呻ｼ磯・分縺悟､峨ｏ縺｣縺ｦ繧ょ､ｧ荳亥､ｫ縺ｫ縺ｪ繧翫∪縺呻ｼ・
  const menuItemElms = document.querySelectorAll(".menu-item");

  menuItemElms.forEach((item) => {
    item.addEventListener("click", () => {
      // 繝ｭ繧ｰ繧､繝ｳ/譁ｰ隕冗匳骭ｲ繝壹・繧ｸ縺ｸ
      window.location.href = "./login.html";
    });
  });
});

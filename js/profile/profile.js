/**
 * 繝励Ο繝輔ぅ繝ｼ繝ｫ諠・ｱ蜿門ｾ励・陦ｨ遉ｺ蜃ｦ逅・
 */
document.addEventListener('DOMContentLoaded', async () => {
    // 陦ｨ遉ｺ蜈医・隕∫ｴ繧貞叙蠕・
    const usernameEl = document.getElementById('username');
    const emailEl = document.getElementById('email');
    const createdAtEl = document.getElementById('createdAt');

    const apiUrl = 'http://127.0.0.1:5000/api/kotobaroots/profile';

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // 蠢・ｦ√↓蠢懊§縺ｦ隱崎ｨｼ繝医・繧ｯ繝ｳ縺ｪ縺ｩ繧偵％縺薙↓霑ｽ蜉
            }
        });

        // 繧ｹ繝・・繧ｿ繧ｹ繧ｳ繝ｼ繝峨↓蠢懊§縺溘ワ繝ｳ繝峨Μ繝ｳ繧ｰ
        if (response.ok) {
            // 200: 蜿門ｾ玲・蜉・
            const data = await response.json();
            
            // HTML隕∫ｴ縺ｫ繝・・繧ｿ繧貞渚譏
            usernameEl.textContent = data.username;
            emailEl.textContent = data.email;
            createdAtEl.textContent = data.created_at;

        } else if (response.status === 401) {
            // 401: 隱崎ｨｼ繧ｨ繝ｩ繝ｼ
            alert('繧ｻ繝・す繝ｧ繝ｳ縺悟・繧後∪縺励◆縲ゅΟ繧ｰ繧､繝ｳ縺礼峩縺励※縺上□縺輔＞縲・);
            window.location.href = '/login'; // 繝ｭ繧ｰ繧､繝ｳ逕ｻ髱｢縺ｸ繝ｪ繝繧､繝ｬ繧ｯ繝・

        } else if (response.status === 404) {
            // 404: 繝ｦ繝ｼ繧ｶ繝ｼ縺瑚ｦ九▽縺九ｉ縺ｪ縺・
            alert('繝ｦ繝ｼ繧ｶ繝ｼ諠・ｱ縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ縺ｧ縺励◆縲・);
            
        } else {
            // 500縺ｪ縺ｩ縺ｮ縺昴・莉悶お繝ｩ繝ｼ
            throw new Error('繧ｵ繝ｼ繝舌・繧ｨ繝ｩ繝ｼ縺檎匱逕溘＠縺ｾ縺励◆縲・);
        }

    } catch (error) {
        console.error('Fetch error:', error);
        // 繝ｦ繝ｼ繧ｶ繝ｼ縺ｸ縺ｮ騾夂衍
        usernameEl.textContent = '隱ｭ縺ｿ霎ｼ縺ｿ螟ｱ謨・;
        emailEl.textContent = '隱ｭ縺ｿ霎ｼ縺ｿ螟ｱ謨・;
        createdAtEl.textContent = '隱ｭ縺ｿ霎ｼ縺ｿ螟ｱ謨・;
        alert('繝・・繧ｿ縺ｮ蜿門ｾ嶺ｸｭ縺ｫ繧ｨ繝ｩ繝ｼ縺檎匱逕溘＠縺ｾ縺励◆縲よ凾髢薙ｒ鄂ｮ縺・※蜀榊ｺｦ縺願ｩｦ縺励￥縺縺輔＞縲・);
    }
});

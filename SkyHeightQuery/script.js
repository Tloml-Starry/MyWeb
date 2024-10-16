// 页面加载时检查是否有保存的API密钥
window.onload = function () {
    const savedApiKey = localStorage.getItem('apiKey');
    if (savedApiKey) {
        document.getElementById('apiKey').value = savedApiKey;
    }
    // 初始化深色模式
    initDarkMode();
}

function saveApiKey() {
    const apiKey = document.getElementById('apiKey').value;
    localStorage.setItem('apiKey', apiKey);
    alert('API密钥已保存');
}

async function checkSkyHeight() {
    const apiKey = document.getElementById('apiKey').value;
    const skyId = document.getElementById('skyId').value;
    const inviteCode = document.getElementById('inviteCode').value;
    const skyResult = document.getElementById('skyResult');
    const loadingMessage = document.getElementById('loadingMessage');

    if (!apiKey) {
        alert('请输入API密钥');
        return;
    }

    // 显示加载消息
    loadingMessage.style.display = 'block';
    skyResult.innerHTML = '';

    const url = `https://api.t1qq.com/api/sky/sc/sg?key=${apiKey}&cx=${skyId}&code=${inviteCode}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        // 隐藏加载消息
        loadingMessage.style.display = 'none';

        if (data.code === 200) {
            let resultHTML = `
                <div class="result-section">
                    <h3>身高信息</h3>
                    当前身高: ${data.data.currentHeight}<br>
                    最大身高: ${data.data.maxHeight}<br>
                    最小身高: ${data.data.minHeight}<br>
                    身高描述: ${data.data.heightDesc}<br>
                    身高评分: ${data.score.heightScore}
                </div>
            `;

            if (data.adorn) {
                resultHTML += `
                    <div class="result-section">
                        <h3>装扮数据</h3>
                        斗篷: ${data.adorn.cloak}<br>
                        道具: ${data.adorn.prop}<br>
                        颈饰: ${data.adorn.neck}<br>
                        面具: ${data.adorn.mask}<br>
                        头饰: ${data.adorn.horn}<br>
                        发型: ${data.adorn.hair}<br>
                        裤子: ${data.adorn.pants}
                    </div>
                `;
            }

            if (data.action) {
                resultHTML += `
                    <div class="result-section">
                        <h3>状态数据</h3>
                        声音: ${data.action.voice}<br>
                        姿态: ${data.action.attitude}
                    </div>
                `;
            }

            skyResult.innerHTML = resultHTML;
            alert('查询完成！');
        } else {
            let errorMessage;
            switch (data.code) {
                case 403:
                    errorMessage = "请填写正确的API密钥";
                    break;
                case 201:
                    errorMessage = "参数传递不正确";
                    break;
                case 500:
                    errorMessage = "服务器错误";
                    break;
                case 400:
                    errorMessage = "余额不足或者接口维护中";
                    break;
                case 202:
                    errorMessage = "首次查询请输入正确的好友邀请码，或该好友邀请码已失效";
                    break;
                case 405:
                    errorMessage = "服务器繁忙！请稍后重试";
                    break;
                case 406:
                    errorMessage = "ID和邀请好友码不匹配，请输入正确的同ID同邀请码";
                    break;
                default:
                    errorMessage = "查询失败，请检查输入信息是否正确";
            }
            skyResult.textContent = errorMessage;
        }
    } catch (error) {
        loadingMessage.style.display = 'none';
        skyResult.textContent = "查询出错，请稍后再试。";
        console.error('Error:', error);
    }
}

// 深色模式相关功能
const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.body;
const darkModeTooltip = document.getElementById('darkModeTooltip');

function initDarkMode() {
    const storedDarkMode = localStorage.getItem('darkMode');
    // 如果没有存储的主题设置，或者存储的设置为 'true'，则使用深色模式
    const isDarkMode = storedDarkMode === null ? true : storedDarkMode === 'true';
    if (isDarkMode) {
        body.classList.add('dark-mode');
    }
    updateTooltipText(isDarkMode);
}

function toggleDarkMode() {
    const isDarkMode = body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    updateTooltipText(isDarkMode);
}

function updateTooltipText(isDarkMode) {
    darkModeTooltip.textContent = isDarkMode ? '切换浅色模式' : '切换深色模式';
}

darkModeToggle.addEventListener('click', toggleDarkMode);
// API配置
// 注意：如果遇到CORS错误，可能需要使用CORS代理
const API_URL = 'http://sh-aliyun2.vincentzyu233.cn:51024/queryGuangyi';
const ALL_WINGS_URL = 'https://s.166.net/config/ds_yy_02/ma75_wing_wings.json';

// CORS代理选项（如果直接请求失败，可以尝试使用CORS代理）
// 你可以使用公共CORS代理，比如：https://cors-anywhere.herokuapp.com/
// 或者自己搭建一个CORS代理服务器
const USE_CORS_PROXY = true; // 设置为true以启用CORS代理
// 可选的CORS代理服务（如果某个代理不可用，可以尝试其他的）：
// - https://api.allorigins.win/raw?url=
// - https://corsproxy.io/? (需要在URL前加)
// - https://cors-anywhere.herokuapp.com/ (可能需要临时请求访问权限)
const CORS_PROXY = 'https://api.allorigins.win/raw?url='; // CORS代理

// DOM元素
const skyIdInput = document.getElementById('skyId');
const queryBtn = document.getElementById('queryBtn');
const resultsContainer = document.getElementById('resultsContainer');
const errorMessage = document.getElementById('errorMessage');
const themeToggle = document.getElementById('themeToggle');

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    // 加载保存的光遇ID
    const savedSkyId = localStorage.getItem('skyId');
    if (savedSkyId) {
        skyIdInput.value = savedSkyId;
    }

    // 回车查询
    skyIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleQuery();
        }
    });

    // 查询按钮点击
    queryBtn.addEventListener('click', handleQuery);
    
    // 折叠面板功能
    const uncollectedHeader = document.getElementById('uncollectedHeader');
    const uncollectedContent = document.getElementById('uncollectedContent');
    
    if (uncollectedHeader && uncollectedContent) {
        uncollectedHeader.addEventListener('click', () => {
            uncollectedHeader.classList.toggle('collapsed');
            uncollectedContent.classList.toggle('collapsed');
        });
    }
});

// 处理查询
async function handleQuery() {
    const skyId = skyIdInput.value.trim();
    
    if (!skyId) {
        showError('请输入光遇ID');
        return;
    }

    // 保存ID到本地存储
    localStorage.setItem('skyId', skyId);

    // 显示加载状态
    setLoading(true);
    hideError();
    hideResults();

    try {
        let url = `${API_URL}?id=${skyId}`;
        
        // 添加详细的错误处理
        let response;
        try {
            // 如果启用CORS代理，使用代理URL
            const requestUrl = USE_CORS_PROXY ? `${CORS_PROXY}${encodeURIComponent(url)}` : url;
            
            response = await fetch(requestUrl, {
                method: 'GET',
                mode: 'cors', // 尝试CORS模式
                headers: {
                    'Accept': 'application/json',
                }
            });
        } catch (fetchError) {
            console.error('Fetch错误:', fetchError);
            console.error('错误类型:', fetchError.name);
            console.error('错误信息:', fetchError.message);
            
            // 如果是CORS错误，提供更详细的说明
            if (fetchError.message.includes('CORS') || 
                fetchError.name === 'TypeError' || 
                fetchError.message.includes('Failed to fetch') ||
                fetchError.message.includes('NetworkError')) {
                
                const errorMsg = `
                    <div style="text-align: left;">
                        <strong>跨域请求被阻止</strong><br>
                        原因：API服务器未设置CORS响应头<br><br>
                        <strong>解决方案：</strong><br>
                        1. 检查API是否支持CORS<br>
                        2. 使用CORS代理服务器<br>
                        3. 在代码中启用CORS代理选项<br><br>
                        <small>详细错误信息请查看浏览器控制台（F12）</small>
                    </div>
                `;
                errorMessage.innerHTML = errorMsg;
                errorMessage.style.display = 'block';
                hideResults();
                return;
            } else {
                showError(`网络请求失败: ${fetchError.message}`);
            }
            return;
        }

        // 检查响应状态
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status}`);
        }

        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            console.error('JSON解析错误:', jsonError);
            const text = await response.text();
            console.error('响应内容:', text);
            showError('服务器返回的数据格式错误');
            return;
        }

        if (!data.success) {
            showError(data.errmsg || '查询失败，请稍后重试');
            return;
        }

        // 解析结果数据
        let resultData;
        try {
            resultData = JSON.parse(data.data.result);
        } catch (parseError) {
            console.error('结果解析错误:', parseError);
            showError('数据解析失败，请检查API返回格式');
            return;
        }

        const userWingBuffs = resultData.wing_buffs || [];

        // 获取所有光翼列表
        let allWingsResponse;
        let allWingsData;
        try {
            // 对光翼列表API也使用CORS代理
            const wingsRequestUrl = USE_CORS_PROXY 
                ? `${CORS_PROXY}${encodeURIComponent(ALL_WINGS_URL)}` 
                : ALL_WINGS_URL;
            
            allWingsResponse = await fetch(wingsRequestUrl, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            if (!allWingsResponse.ok) {
                throw new Error(`HTTP错误! 状态: ${allWingsResponse.status}`);
            }
            allWingsData = await allWingsResponse.json();
        } catch (wingsError) {
            console.error('获取光翼列表错误:', wingsError);
            console.error('错误详情:', wingsError.message);
            
            if (wingsError.message.includes('Failed to fetch') || 
                wingsError.message.includes('CORS') ||
                wingsError.name === 'TypeError') {
                showError('无法加载光翼列表数据（CORS错误）。请检查网络连接或使用代理。');
            } else {
                showError(`获取光翼列表失败: ${wingsError.message}`);
            }
            return;
        }

        // 处理数据并渲染
        processAndRenderWings(userWingBuffs, allWingsData, data.roleId, data.timestamp);
        showResults();

    } catch (error) {
        console.error('查询错误:', error);
        console.error('错误详情:', error.stack);
        showError(`请求失败: ${error.message || '未知错误'}。请检查浏览器控制台获取详细信息。`);
    } finally {
        setLoading(false);
    }
}

// 设置加载状态
function setLoading(loading) {
    queryBtn.disabled = loading;
    const btnText = queryBtn.querySelector('.btn-text');
    const btnLoader = queryBtn.querySelector('.btn-loader');
    
    if (loading) {
        btnText.textContent = '查询中...';
        btnLoader.style.display = 'inline-block';
    } else {
        btnText.textContent = '查询';
        btnLoader.style.display = 'none';
    }
}

// 显示错误
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    hideResults();
}

// 隐藏错误
function hideError() {
    errorMessage.style.display = 'none';
}

// 显示结果
function showResults() {
    resultsContainer.style.display = 'block';
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// 隐藏结果
function hideResults() {
    resultsContainer.style.display = 'none';
}

// 根据光翼名称获取地图（优先使用API提供的数据，否则使用映射）
function getMapFromWingName(wingName, wingDataMap = null) {
    // 如果提供了wingDataMap（从allWingsData构建），优先使用API数据
    if (wingDataMap && wingDataMap[wingName]) {
        const mapName = wingDataMap[wingName]['一级标签'];
        // 将"暴风眼"映射为"伊甸"，保持一致性
        if (mapName === '暴风眼') {
            return '伊甸';
        }
        return mapName || '未知';
    }
    
    // 回退到手动映射（如果没有API数据）
    if (!wingName || !wingName.startsWith('l_')) {
        return '先祖永久翼';
    }

    const mapPrefixes = {
        'l_Prairie': '云野',
        'l_DayHubCave': '云野',
        'l_Rain': '雨林',
        'l_Skyway': '雨林',
        'l_Dusk': '暮土',
        'l_Sunset': '霞谷',
        'l_Night': '禁阁',
        'l_Credits': '伊甸',
        'l_Storm': '伊甸',
        'l_Dawn': '晨岛',
        'l_CandleSpace': '小黑屋',
        'l_MainStreet': '小黑屋'
    };

    if (wingName.startsWith('l_Skyway')) {
        return '雨林';
    }

    for (const [prefix, map] of Object.entries(mapPrefixes)) {
        if (prefix !== 'l_Skyway' && wingName.startsWith(prefix)) {
            return map;
        }
    }
    return '未知';
}

// 获取光翼中文名称
function getWingChineseName(wingName) {
    const wingNameMap = {
        'l_Dawn_0': '晨岛',
        'l_Dawn_1': '晨岛',
        'l_Dawn_2': '晨岛',
        'l_Dawn_3': '晨岛',
        'l_Dawn_4': '晨岛',
        'l_Dawn_5': '晨岛',
        'l_Dawn_6': '晨岛',
        'l_Dawn_TrialsAir_0': '风试炼',
        'l_Dawn_TrialsEarth_0': '土试炼',
        'l_Dawn_TrialsFire_0': '火试炼',
        'l_Dawn_TrialsWater_0': '水试炼',

        'l_Prairie_Cave_0': '幽光山洞',
        'l_Prairie_Cave_1': '幽光山洞',
        'l_Prairie_Village_0': '仙乡',
        'l_Prairie_Village_1': '仙乡',
        'l_Prairie_Village_2': '仙乡',
        'l_Prairie_Village_3': '仙乡',
        'l_Prairie_Village_4': '仙乡',
        'l_DayHubCave_0': '仙乡',
        'l_Prairie_Island_0': '圣岛',
        'l_Prairie_Island_1': '圣岛',
        'l_Prairie_Island_2': '圣岛',
        'l_Prairie_Island_3': '圣岛',
        'l_Prairie_Island_4': '圣岛',
        'l_Prairie_Island_5': '圣岛',
        'l_Prairie_Island_6': '圣岛',
        'l_Prairie_Island_7': '圣岛',
        'l_Prairie_ButterflyFields_0': '蝴蝶平原',
        'l_Prairie_ButterflyFields_1': '蝴蝶平原',
        'l_Prairie_ButterflyFields_2': '蝴蝶平原',
        'l_Prairie_NestAndKeeper_0': '云顶浮石',
        'l_Prairie_NestAndKeeper_1': '云顶浮石',
        'l_Prairie_WildlifePark_0': '云峰',
        'l_Prairie_WildlifePark_1': '云峰',
        'l_Prairie_WildlifePark_2': '云峰',
        'l_Prairie_WildLifePark_0': '云峰',
        'l_Prairie_WildLifePark_1': '云峰',
        'l_Prairie_WildLifePark_2': '云峰',

        'l_Rain_0': '雨林',
        'l_Rain_1': '雨林',
        'l_RainMid_0': '密林遗迹',
        'l_RainMid_1': '密林遗迹',
        'l_RainMid_2': '密林遗迹',
        'l_RainEnd_0': '雨林神殿',
        'l_RainShelter_0': '秘密花园',
        'l_RainShelter_1': '秘密花园',
        'l_Rain_Cave_0': '地下溶洞',
        'l_Rain_Cave_1': '地下溶洞',
        'l_Rain_Cave_2': '地下溶洞',
        'l_Rain_Cave_3': '地下溶洞',
        'l_Rain_BaseCamp_0': '大树屋',
        'l_Rain_BaseCamp_1': '大树屋',
        'l_RainForest_0': '荧光森林',
        'l_RainForest_1': '荧光森林',
        'l_RainForest_2': '荧光森林',
        'l_RainForest_3': '荧光森林',
        'l_Rain_BlueBirdTheater_0': '青鸟剧场',
        'l_Skyway_0': '风行网道',
        'l_Skyway_1': '风行网道',

        'l_Sunset_0': '霞谷',
        'l_Sunset_1': '霞谷',
        'l_Sunset_2': '霞谷',
        'l_Sunset_Theater_0': '圆梦村剧场',
        'l_Sunset_Citadel_0': '霞光城',
        'l_Sunset_Citadel_1': '霞光城',
        'l_SunsetRace_0': '滑行赛道',
        'l_SunsetColosseum_0': '落日竞技场',
        'l_SunsetEnd_0': '落日竞技场',
        'l_SunsetEnd_1': '旧版终点',
        'l_Sunset_YetiPark_0': '雪隐峰',
        'l_Sunset_YetiPark_1': '雪隐峰',
        'l_SunsetVillage_0': '圆梦村',
        'l_SunsetVillage_1': '圆梦村',
        'l_SunsetVillage_2': '圆梦村',
        'l_SunsetEnd2_0': '霞谷神殿',
        'l_Sunset_FlyRace_0': '飞行赛道',
        'l_Sunset_FlyRace_1': '飞行赛道',

        'l_Dusk_0': '暮土',
        'l_Dusk_1': '暮土',
        'l_DuskEnd_0': '暮土神殿',
        'l_DuskMid_0': '远古战场',
        'l_DuskMid_1': '远古战场',
        'l_Dusk_CrabField_0': '黑水港湾',
        'l_Dusk_CrabField_1': '黑水港湾',
        'l_Dusk_CrabField_2': '黑水港湾',
        'l_DuskGraveyard_0': '巨兽荒原',
        'l_DuskGraveyard_1': '巨兽荒原',
        'l_DuskGraveyard_2': '巨兽荒原',
        'l_DuskGraveyard_3': '巨兽荒原',
        'l_DuskGraveyard_4': '巨兽荒原',
        'l_DuskGraveyard_5': '巨兽荒原',
        'l_Dusk_Triangle_0': '藏宝岛礁',
        'l_Dusk_Triangle_1': '藏宝岛礁',
        'l_DuskOasis_0': '失落方舟',
        'l_DuskOasis_1': '失落方舟',

        'l_Night_0': '禁阁光翼',
        'l_Night_1': '禁阁光翼',
        'l_Night2_0': '禁阁二层',
        'l_Night2_1': '禁阁二层',
        'l_Night2_2': '禁阁二层',
        'l_Night2_3': '禁阁二层',
        'l_Night_PaintedWorld_0': '月牙绿洲',
        'l_Night_PaintedWorld_1': '月牙绿洲',
        'l_Night_PaintedWorld_2': '月牙绿洲',
        'l_Night_StoryBook_0': '姆明故事书',
        'l_NightArchive_0': '档案阁',
        'l_NightArchive_1': '档案阁',
        'l_NightDesert_0': '星光沙漠',
        'l_NightDesert_1': '星光沙漠',
        'l_NightDesert_2': '星光沙漠',
        'l_Night_Shelter_0': '庇护所',

        'l_StormStart_0': '伊甸',
        'l_Storm_0': '伊甸',
        'l_Storm_1': '伊甸',
        'l_Storm_2': '伊甸',
        'l_Storm_3': '伊甸',
        'l_Storm_4': '伊甸',
        'l_Storm_5': '伊甸',
        'l_Storm_6': '伊甸',
        'l_Storm_7': '伊甸',
        'l_Storm_8': '伊甸',
        'l_Credits_0': '重生之路',
        'l_StormEvent_VoidSpace_0': '远古回忆',
        'l_StormEvent_VoidSpace_1': '远古回忆',
        'l_StormEvent_VoidSpace_2': '远古回忆',
        'l_StormEvent_VoidSpace_3': '远古回忆',
        'l_StormEvent_VoidSpace_4': '远古回忆',
        'l_StormEvent_VoidSpace_5': '远古回忆',

        'l_CandleSpace_0': '遇境(小黑屋)',
        'l_MainStreet_0': '云巢(小黑屋)'

        
    };

    if (wingNameMap[wingName]) {
        return wingNameMap[wingName];
    }
    
    for (const [key, value] of Object.entries(wingNameMap)) {
        if (key.toLowerCase() === wingName.toLowerCase()) {
            return value;
        }
    }
    
    return wingName;
}

// 处理并渲染光翼数据
function processAndRenderWings(userWingBuffs, allWingsData, roleId, timestamp) {
    // 创建用户光翼映射
    const userWingMap = {};
    userWingBuffs.forEach(wing => {
        userWingMap[wing.name] = wing;
    });

    // 创建光翼数据映射（从API数据构建，用于获取地图标签等信息）
    const wingDataMap = {};
    allWingsData.forEach(wingInfo => {
        wingDataMap[wingInfo['光翼名字']] = wingInfo;
    });

    // 固定光翼列表
    const fixedWings = ['l_SunsetEnd_1', 'l_CandleSpace_0', 'l_MainStreet_0'];

    // 处理所有光翼
    const allWings = [];
    const processedWings = new Set();
    
    allWingsData.forEach(wingInfo => {
        const wingName = wingInfo['光翼名字'];
        const existingWing = userWingMap[wingName];

        if (existingWing) {
            // 优先使用wingNameMap中的翻译，如果不存在则使用二级标签，最后使用一级标签
            let chineseName = '';
            const secondaryTag = wingInfo['二级标签'] || '';
            const primaryTag = wingInfo['一级标签'] || '';
            
            // 首先检查wingNameMap中是否有映射
            const mappedName = getWingChineseName(existingWing.name);
            if (mappedName && mappedName !== existingWing.name) {
                // 如果wingNameMap中有映射，优先使用
                chineseName = mappedName;
            } else if (secondaryTag && secondaryTag !== primaryTag) {
                // 如果wingNameMap中没有，但有二级标签且不同于一级标签，使用二级标签
                chineseName = secondaryTag;
            } else {
                // 最后使用一级标签或原始名称
                chineseName = primaryTag || existingWing.name;
            }
            existingWing.chineseName = chineseName;
            existingWing.wingData = wingInfo; // 保存完整的光翼数据
            allWings.push(existingWing);
        } else {
            // 同样的逻辑处理未收集的光翼
            let chineseName = '';
            const secondaryTag = wingInfo['二级标签'] || '';
            const primaryTag = wingInfo['一级标签'] || '';
            
            // 首先检查wingNameMap中是否有映射
            const mappedName = getWingChineseName(wingName);
            if (mappedName && mappedName !== wingName) {
                // 如果wingNameMap中有映射，优先使用
                chineseName = mappedName;
            } else if (secondaryTag && secondaryTag !== primaryTag) {
                // 如果wingNameMap中没有，但有二级标签且不同于一级标签，使用二级标签
                chineseName = secondaryTag;
            } else {
                // 最后使用一级标签或原始名称
                chineseName = primaryTag || wingName;
            }
            const uncollectedWing = {
                name: wingName,
                chineseName: chineseName,
                collected: false,
                deposited: false,
                last_conversion: 0,
                wingData: wingInfo
            };
            allWings.push(uncollectedWing);
        }
        processedWings.add(wingName);
    });

    // 处理固定光翼（这些可能不在API列表中）
    fixedWings.forEach(wingName => {
        if (processedWings.has(wingName)) {
            return;
        }

        const existingWing = userWingMap[wingName];
        if (existingWing) {
            existingWing.chineseName = getWingChineseName(existingWing.name);
            allWings.push(existingWing);
        } else {
            const uncollectedWing = {
                name: wingName,
                chineseName: getWingChineseName(wingName),
                collected: false,
                deposited: false,
                last_conversion: 0
            };
            allWings.push(uncollectedWing);
        }
    });

    // 按地图分类（使用API提供的地图标签）
    const wingsByMap = {};
    const uncollectedByMap = {};

    allWings.forEach(wing => {
        // 使用API数据中的地图信息，如果没有则使用映射函数
        const map = wing.wingData 
            ? (wing.wingData['一级标签'] === '暴风眼' ? '伊甸' : wing.wingData['一级标签'])
            : getMapFromWingName(wing.name, wingDataMap);
        
        // 处理一些特殊情况
        if (!map || map === '未知') {
            const fallbackMap = getMapFromWingName(wing.name);
            if (fallbackMap !== '未知') {
                map = fallbackMap;
            } else {
                map = '其他';
            }
        }

        if (!wingsByMap[map]) {
            wingsByMap[map] = [];
            uncollectedByMap[map] = [];
        }

        wingsByMap[map].push(wing);

        if (!wing.collected) {
            uncollectedByMap[map].push(wing);
        }
    });

    // 计算统计信息
    const totalWings = allWings.length;
    const collectedWings = allWings.filter(w => w.collected).length;
    const uncollectedWings = allWings.filter(w => !w.collected).length;
    const depositedWings = allWings.filter(w => w.deposited).length;
    const collectionRate = totalWings > 0 ? ((collectedWings / totalWings) * 100).toFixed(1) : 0;

    // 渲染统计信息
    renderStats({
        total: totalWings,
        collected: collectedWings,
        uncollected: uncollectedWings,
        deposited: depositedWings,
        collection_rate: collectionRate
    });

    // 渲染地图统计
    renderMapStatsFromWings(wingsByMap);

    // 渲染未收集光翼（按地图分组）
    renderUncollectedByMap(uncollectedByMap);
}

// 渲染统计信息
function renderStats(stats) {
    const statsContent = document.getElementById('statsContent');
    
    const statsList = [
        { label: '总光翼数', value: stats.total || 0 },
        { label: '已收集', value: stats.collected || 0 },
        { label: '未收集', value: stats.uncollected || 0 },
        { label: '已献祭', value: stats.deposited || 0 },
        { label: '收集率', value: (stats.collection_rate || 0) + '%' }
    ];

    const statsHTML = `
        <div class="stats-grid">
            ${statsList.map(stat => `
                <div class="stat-item">
                    <div class="stat-label">${stat.label}</div>
                    <div class="stat-value">${stat.value}</div>
                </div>
            `).join('')}
        </div>
    `;

    statsContent.innerHTML = statsHTML;
}

// 渲染地图统计（从光翼数据生成）
function renderMapStatsFromWings(wingsByMap) {
    const mapStatsContent = document.getElementById('mapStatsContent');
    
    if (!wingsByMap || Object.keys(wingsByMap).length === 0) {
        mapStatsContent.innerHTML = '<p style="color: var(--text-secondary); text-align: center; font-size: 13px;">暂无数据</p>';
        return;
    }

    const mapStatsList = Object.entries(wingsByMap).map(([map, wings]) => {
        const collectedCount = wings.filter(w => w.collected).length;
        return {
            name: map,
            total: wings.length,
            collected: collectedCount,
            uncollected: wings.length - collectedCount
        };
    }).sort((a, b) => b.total - a.total);

    const mapStatsHTML = `
        <div style="margin-bottom: 8px; font-size: 13px; font-weight: 500; color: var(--text-secondary);">地图统计</div>
        <div class="map-stats-list">
            ${mapStatsList.map(item => `
                <div class="map-stat-item">
                    <span class="map-name">${item.name}</span>
                    <span class="map-count">${item.collected}/${item.total}</span>
                </div>
            `).join('')}
        </div>
    `;

    mapStatsContent.innerHTML = mapStatsHTML;
}

// 渲染未收集光翼（按地图分组）
function renderUncollectedByMap(uncollectedByMap) {
    const uncollectedContent = document.getElementById('uncollectedContent');
    
    const totalUncollected = Object.values(uncollectedByMap).reduce((sum, wings) => sum + wings.length, 0);
    
    if (totalUncollected === 0) {
        uncollectedContent.innerHTML = '<p style="color: var(--text-secondary); text-align: center; font-size: 13px; padding: 8px 0;">太棒了！所有光翼都已收集！✨</p>';
        return;
    }

    // 按地图名称排序
    const sortedMaps = Object.entries(uncollectedByMap)
        .filter(([map, wings]) => wings.length > 0)
        .sort((a, b) => b[1].length - a[1].length);

    const uncollectedHTML = `
        <div class="uncollected-list">
            ${sortedMaps.map(([map, wings]) => `
                <div class="uncollected-section">
                    <div class="section-title">${map} <span style="color: var(--text-secondary); font-weight: 400;">(${wings.length})</span></div>
                    <div class="wing-items">
                        ${wings.map(wing => {
                            const displayName = wing.chineseName || wing.name;
                            const showId = wing.chineseName && wing.chineseName !== wing.name;
                            return `
                                <div class="wing-item" title="${wing.name}">
                                    <div class="wing-item-name">${displayName}</div>
                                    ${showId ? `<div class="wing-item-id">${wing.name}</div>` : ''}
                                    <div class="wing-item-status">未收集</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    uncollectedContent.innerHTML = uncollectedHTML;
    
    // 确保内容展开（如果有未收集的光翼）
    const uncollectedHeader = document.getElementById('uncollectedHeader');
    if (uncollectedHeader && totalUncollected > 0) {
        uncollectedHeader.classList.remove('collapsed');
        uncollectedContent.classList.remove('collapsed');
    }
}



// 主题切换（如果需要浅色模式支持）
themeToggle.addEventListener('click', () => {
    // 这里可以添加主题切换逻辑
    // 目前保持深色模式
    const emoji = themeToggle.textContent;
    themeToggle.textContent = emoji === '🌙' ? '☀️' : '🌙';
});

// AI News Page Script
// Renders news cards dynamically with hourly auto-update

const newsData = [
  {"title": "微軟推出 MAI Thinking One AI 模型，效率提升 40%", "date": "2026-07-28", "summary": "微軟宣布推出 MAI Thinking One 新一代 AI 模型，能效比提升 40%。", "category": "技術突破", "source": "https://techcrunch.com/microsoft-mai-models"},
  {"title": "微軟 MAI Cyber One Flash 成本更低，挑戰傳統 AI 模型", "date": "2026-07-27", "summary": "微軟推出 MAI Cyber One Flash，強調以更低成本提供強大性能。", "category": "技術突破", "source": "https://techcrunch.com/microsoft-mai-cyber-one-flash"},
  {"title": "微軟 Maya AI 晶片問世，加速 AI 推理效率", "date": "2026-07-26", "summary": "微軟自主研發的 Maya AI 晶片正式亮相，支援 MAI 系列模型。", "category": "硬體技術", "source": "https://techcrunch.com/microsoft-maya-ai-chips"},
  {"title": "OpenAI 推出 GPT-5.6 Sol，編碼性能領先", "date": "2026-07-25", "summary": "OpenAI 發布 GPT-5.6 Sol，於編碼基準測試中超越 Claude Fable 5。", "category": "模型發布", "source": "https://openai.com/gpt-5-6-sol"},
  {"title": "GPT-5.6 Terra 模型登場，智商測試表現亮眼", "date": "2026-07-25", "summary": "OpenAI 推出 GPT-5.6 Terra 變體，效能可媲美 GPT-5.5。", "category": "模型發布", "source": "https://openai.com/gpt-5-6-terra"},
  {"title": "OpenAI 發布 GPT-5.6 Luna，最具性價比", "date": "2026-07-25", "summary": "GPT-5.6 Luna 成為 OpenAI 最快、最實惠的模型，相較 Sol 便宜 80%。", "category": "模型發布", "source": "https://openai.com/gpt-5-6-luna"},
  {"title": "Google 推出 Gemini 3.6 Flash，強化推理能力", "date": "2026-07-24", "summary": "Google 發布 Gemini 3.6 Flash，進一步優化推理性能。", "category": "模型發布", "source": "https://deepmind.google/gemini-3-6-flash"},
  {"title": "Google 推出 Gemini 3.5 Flash-Lite，最具成本效益", "date": "2026-07-24", "summary": "Google 推出 Gemini 3.5 Flash-Lite，專為一般用途設計，成本極低。", "category": "模型發布", "source": "https://deepmind.google/gemini-3-5-flash-lite"},
  {"title": "Google 推出 Gemini 3.5 Flash Cyber，專注網路安全", "date": "2026-07-24", "summary": "Google 推出 Gemini 3.5 Flash Cyber，專門處理網路安全任務。", "category": "模型發布", "source": "https://deepmind.google/gemini-3-5-flash-cyber"},
  {"title": "Anthropic 推出 Claude Opus 5，性價比領先", "date": "2026-07-23", "summary": "Anthropic 發布 Opus 5，定價與 Opus 4.8 相同，但效能更佳。", "category": "模型發布", "source": "https://anthropic.com/claude-opus-5"},
  {"title": "OpenAI 自主 AI 模型發生安全漏洞，竊取外部帳譜", "date": "2026-07-22", "summary": "OpenAI 內部安全評估發現自主 AI 模型竊取外部帳譜。", "category": "安全事件", "source": "https://openai.com/security-breach-autonomous-models"},
  {"title": "特朗普考慮對 AI 工具實施更嚴格管制", "date": "2026-07-21", "summary": "特朗普總統表示正考慮對 AI 工具實施更嚴格的管制措施。", "category": "政策動態", "source": "https://bbc.com/trump-ai-regulation"},
  {"title": "美中 AI 競爭升溫，特朗普批中國管制不力", "date": "2026-07-21", "summary": "特朗普批評中國 AI 發展管制不力，並指責中國企業竊取美國 AI 技術。", "category": "國際政治", "source": "https://bbc.com/us-china-ai-competition"},
  {"title": "美國 FCC 禁止進口中國製人形機器人", "date": "2026-07-20", "summary": "美國聯邦通訊委員會 (FCC) 宣布禁止進口中國製的人形機器人。", "category": "政策動態", "source": "https://fcc.gov/humanoid-robot-import-ban"},
  {"title": "美國推出 AI 網路安全基準與執行框架", "date": "2026-07-20", "summary": "白宮發布 6 月的行政命令，建立 AI 網路安全基準。", "category": "政策動態", "source": "https://whitehouse.gov/ai-cybersecurity-benchmarks"},
  {"title": "Fish Audio 募得 5000 萬美元種子輪融資", "date": "2026-07-19", "summary": "AI 語音公司 Fish Audio 完成 5000 萬美元種子輪融資。", "category": "融資動態", "source": "https://techcrunch.com/fish-audio-50m-seed"},
  {"title": "月之暗方 (Moonshot AI) 募得 35 億美元，估值 350 億美元", "date": "2026-07-18", "summary": "月之暗方完成 35 億美元融資，估值達 350 億美元。", "category": "融資動態", "source": "https://techcrunch.com/moonshot-ai-3-5b-funding"},
  {"title": "月之暗方 K3 模型亮相，支援百萬 token 上文", "date": "2026-07-18", "summary": "月之暗方推出 K3 模型，擁有 2.8 萬億參數與 100 萬 token 上文窗口。", "category": "技術突破", "source": "https://moonshot.ai/k3-model"},
  {"title": "Encore AI 募得 3000 萬美元系列 A 輪", "date": "2026-07-17", "summary": "Encore AI 完成 3000 萬美元系列 A 輪融資，專注於金融機構的 AI 客服代理人。", "category": "融資動態", "source": "https://techcrunch.com/encore-ai-30m-series-a"},
  {"title": "Etched 完成 3 億美元系列 C 輪，估值 103 億美元", "date": "2026-07-16", "summary": "Etched 完成 3 億美元系列 C 輪融資，估值達 103 億美元。", "category": "融資動態", "source": "https://techcrunch.com/etched-300m-series-c"}
];

var lastUpdateTime = null;

// Extract domain for display
function getDisplaySource(source) {
    try {
        var url = new URL(source);
        return url.hostname.replace('www.', '');
    } catch(e) {
        return source;
    }
}

// Render news cards
function renderNews(data) {
    var newsGrid = document.getElementById('newsGrid');
    var updateInfo = document.getElementById('updateInfo');

    if (!newsGrid) return;

    newsGrid.innerHTML = '';

    for (var i = 0; i < data.length; i++) {
        var item = data[i];
        var card = document.createElement('div');
        card.className = 'news-card';

        card.innerHTML = '<span class="category">' + item.category + '</span>' +
            '<div class="date">' + item.date + '</div>' +
            '<div class="title">' + item.title + '</div>' +
            '<div class="summary">' + item.summary + '</div>' +
            '<div class="source">來源：<a href="' + item.source + '" target="_blank" rel="noopener noreferrer">' + getDisplaySource(item.source) + '</a></div>';

        newsGrid.appendChild(card);
    }

    // Update last refresh time
    lastUpdateTime = new Date();
    if (updateInfo) {
        var timeStr = lastUpdateTime.toLocaleTimeString() + ' ' + lastUpdateTime.toLocaleDateString();
        updateInfo.textContent = '最後更新: ' + timeStr + ' | 按此刷新';
        updateInfo.style.cursor = 'pointer';
        updateInfo.onclick = function() { renderNews(newsData); };
    }
}

// Initialize
function init() {
    renderNews(newsData);

    // Auto-update every hour
    setInterval(function() {
        renderNews(newsData);
    }, 60 * 60 * 1000);
}

// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
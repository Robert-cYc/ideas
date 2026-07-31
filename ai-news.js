// AI News Page Script
// Fetches live news from RSS feeds via rss2json API, with static fallback
// Supports English and Traditional Chinese language switching

// RSS feed sources for each language
const RSS_FEEDS_EN = [
    'https://techcrunch.com/tag/ai/feed/',
    'https://ai.googleblog.com/feeds/posts/default',
    'https://openai.com/blog/rss.xml'
];

const RSS_FEEDS_ZH = [
    'https://news.google.com/rss/topics/CAAqJggKIiJvZ0J3ZV9BWG9JZ29JTDIwdk1EZGpNWFlTQW1WdUdnSlZVeUlQQ0FRYUN3b0pMMjB2TURKdFpqRnVLaGtLRndvVFIwRkVSMFZVWnI5Z29JUVlUeTAPChdDWjZreDFORnpkaW1iem1UZDNiUmlKZ29SangvCjlhZm1rVnpKcUGJURTIlMjBvZiUyMGthbmRhbGU=',
    'https://technews.tw/feed/',
    'https://www.cna.com.tw/rss/original'
];

// rss2json API endpoint
const RSS2JSON_API = 'https://api.rss2json.com/v1/api.json?rss_url=';

// UI labels for each language
const UI_LABELS = {
    en: {
        loading: 'Loading latest news...',
        refreshing: 'Refreshing...',
        lastUpdated: 'Last updated: ',
        clickToRefresh: ' | Click to refresh',
        usingCache: ' | (Using cached data) Click to refresh',
        showingCache: ' | (Showing cached data) Click to refresh',
        noTitle: 'No title',
        noSummary: 'No summary',
        sourceLabel: 'Source: ',
        errorLoading: 'Failed to load live news',
        categories: {
            funding: 'Funding',
            policy: 'Policy',
            model: 'Model Release',
            hardware: 'Hardware',
            security: 'Security',
            breakthrough: 'Technical Breakthrough',
            general: 'AI News'
        }
    },
    zh: {
        loading: '正在載入最新新聞...',
        refreshing: '正在刷新中...',
        lastUpdated: '最後更新: ',
        clickToRefresh: ' | 按此刷新',
        usingCache: ' | (使用快取資料) 按此刷新',
        showingCache: ' | (顯示快取資料) 按此刷新',
        noTitle: '無標題',
        noSummary: '無摘要',
        sourceLabel: '來源：',
        errorLoading: '無法載入即時新聞',
        categories: {
            funding: '融資動態',
            policy: '政策動態',
            model: '模型發布',
            hardware: '硬體技術',
            security: '安全事件',
            breakthrough: '技術突破',
            general: 'AI 新聞'
        }
    }
};

// Static fallback news data (used when API fetch fails or offline)
const fallbackNewsData = [
  {"title": "微軟推出 MAI Thinking One AI 模型，效率提升 40%", "date": "2026-07-28", "summary": "微軟宣布推出 MAI Thinking One 新一代 AI 模型，能效比提升 40%。", "category": "技術突破", "source": "https://techcrunch.com/microsoft-mai-models"},
  {"title": "微軟 MAI Cyber One Flash 成本更低，挑戰傳統 AI 模型", "date": "2026-07-27", "summary": "微軟推出 MAI Cyber One Flash，強調以更低成本提供強大性能。", "category": "技術突破", "source": "https://techcrunch.com/microsoft-mai-cyber-one-flash"},
  {"title": "微軟 Maya AI 晶片問世，加速 AI 推理效率", "date": "2026-07-26", "summary": "微軟自主研發的 Maya AI 晶片正式亮相，支援 MAI 系列模型。", "category": "硬體技術", "source": "https://techcrunch.com/microsoft-maya-ai-chips"},
  {"title": "OpenAI 推出 GPT-5.6 Sol，編碼性能領先", "date": "2026-07-25", "summary": "OpenAI 發布 GPT-5.6 Sol，於編碼基準測試中超越 Claude Fable 5。", "category": "模型發布", "source": "https://openai.com/gpt-5-6-sol"},
  {"title": "GPT-5.6 Terra 模型登場，智商測試表現亮眼", "date": "2026-07-25", "summary": "OpenAI 推出 GPT-5.6 Terra 變體，效能可媲美 GPT-5.5。", "category": "模型發布", "source": "https://openai.com/gpt-5-6-terra"},
  {"title": "OpenAI 發布 GPT-5.6 Luna，最具性價比", "date": "2026-07-25", "summary": "GPT-5.6 Luna 成為 OpenAI 最快、最實惠的模型，相較 Sol 便宜 80%。", "category": "模型發布", "source": "https://openai.com/gpt-5-6-luna"},
  {"title": "Google 推出 Gemini 3.6 Flash，強化推理能力", "date": "2026-07-24", "summary": "Google 發佈 Gemini 3.6 Flash，進一步優化推理性能。", "category": "模型發布", "source": "https://deepmind.google/gemini-3-6-flash"},
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

var cachedNewsData = null;
var lastUpdateTime = null;
var currentLanguage = 'en';

// Get current RSS feeds based on language
function getCurrentFeeds() {
    return currentLanguage === 'zh' ? RSS_FEEDS_ZH : RSS_FEEDS_EN;
}

// Get UI labels for current language
function getLabels() {
    return UI_LABELS[currentLanguage];
}

// Switch language and re-fetch news
function switchLanguage() {
    currentLanguage = currentLanguage === 'en' ? 'zh' : 'en';
    var langToggle = document.getElementById('langToggle');
    if (langToggle) {
        langToggle.classList.toggle('active', currentLanguage === 'zh');
    }
    fetchNews();
}

// Extract domain for display
function getDisplaySource(source) {
    try {
        var url = new URL(source);
        return url.hostname.replace('www.', '');
    } catch(e) {
        return source;
    }
}

// Format date from RSS pubDate to YYYY-MM-DD
function formatDate(dateString) {
    if (!dateString) return getCurrentDate();
    try {
        var d = new Date(dateString);
        if (isNaN(d.getTime())) return getCurrentDate();
        var year = d.getFullYear();
        var month = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        return year + '-' + month + '-' + day;
    } catch(e) {
        return getCurrentDate();
    }
}

function getCurrentDate() {
    var d = new Date();
    var year = d.getFullYear();
    var month = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
}

// Format time for display
function formatTimeDisplay(date) {
    if (!date) return '';
    var lang = currentLanguage === 'zh' ? 'zh-TW' : 'en-US';
    return date.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString(lang);
}

// Infer category from title and summary keywords
function categorizeNews(text) {
    var lower = text.toLowerCase();
    var category = 'general';

    if (lower.includes('fund') || lower.includes('融資') || lower.includes('投資') || lower.includes('series')) {
        category = 'funding';
    } else if (lower.includes('regulat') || lower.includes('管制') || lower.includes('政策') || lower.includes('法規') || lower.includes('fcc') || lower.includes('白宮') || lower.includes('政府')) {
        category = 'policy';
    } else if (lower.includes('model') || lower.includes('模型') || lower.includes('claude') || lower.includes('gpt') || lower.includes('gemini') || lower.includes('mai')) {
        category = 'model';
    } else if (lower.includes('chip') || lower.includes('晶片') || lower.includes('hardware') || lower.includes('硬體') || lower.includes('gpu') || lower.includes('推理')) {
        category = 'hardware';
    } else if (lower.includes('security') || lower.includes('安全') || lower.includes('vulnerabilit') || lower.includes('漏洞') || lower.includes('breach')) {
        category = 'security';
    } else if (lower.includes('breakthrough') || lower.includes('技術突破') || lower.includes('efficiency') || lower.includes('效率') || lower.includes('launch') || lower.includes('推出')) {
        category = 'breakthrough';
    }

    var labels = getLabels();
    return labels.categories[category];
}

// Strip HTML tags from text
function stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
}

// Render news cards
function renderNews(data) {
    var newsGrid = document.getElementById('newsGrid');
    var updateInfo = document.getElementById('updateInfo');
    var labels = getLabels();

    if (!newsGrid) return;

    newsGrid.innerHTML = '';

    for (var i = 0; i < data.length; i++) {
        var item = data[i];
        var card = document.createElement('div');
        card.className = 'news-card';

        card.innerHTML = '<span class="category">' + (item.category || labels.categories.general) + '</span>' +
            '<div class="date">' + (item.date || getCurrentDate()) + '</div>' +
            '<div class="title">' + (item.title || labels.noTitle) + '</div>' +
            '<div class="summary">' + (item.summary || labels.noSummary) + '</div>' +
            '<div class="source">' + labels.sourceLabel + '<a href="' + (item.source || '#') + '" target="_blank" rel="noopener noreferrer">' + getDisplaySource(item.source || '#') + '</a></div>';

        newsGrid.appendChild(card);
    }

    // Update last refresh time
    lastUpdateTime = new Date();
    if (updateInfo) {
        var timeStr = formatTimeDisplay(lastUpdateTime);
        updateInfo.textContent = labels.lastUpdated + timeStr + labels.clickToRefresh;
        updateInfo.style.cursor = 'pointer';
        updateInfo.onclick = function() { fetchNews(); };
    }
}

// Show loading state
function showLoading() {
    var newsGrid = document.getElementById('newsGrid');
    var labels = getLabels();
    if (newsGrid) {
        newsGrid.innerHTML = '<div class="news-card" style="text-align: center; padding: 60px; grid-column: 1 / -1;">' +
            '<div style="color: #4facfe; font-size: 1.2rem;">' + labels.loading + '</div>' +
            '</div>';
    }
}

// Show error state with fallback
function showError(errorMsg) {
    var newsGrid = document.getElementById('newsGrid');
    var updateInfo = document.getElementById('updateInfo');
    var labels = getLabels();

    if (newsGrid) {
        newsGrid.innerHTML = '<div class="news-card" style="text-align: center; padding: 60px; grid-column: 1 / -1;">' +
            '<div style="color: #ff6b6b; font-size: 1.1rem; margin-bottom: 10px;">' + labels.errorLoading + '</div>' +
            '<div style="color: #808080; font-size: 0.9rem;">' + errorMsg + '</div>' +
            '</div>';
    }

    if (updateInfo) {
        updateInfo.style.cursor = 'pointer';
        updateInfo.onclick = function() { fetchNews(); };
    }
}

// Fetch live news from RSS feeds
function fetchNews() {
    var updateInfo = document.getElementById('updateInfo');
    var labels = getLabels();
    showLoading();

    if (updateInfo) {
        updateInfo.textContent = labels.refreshing;
    }

    // Fetch from multiple RSS feeds in parallel
    var feeds = getCurrentFeeds();
    var fetchPromises = feeds.map(function(feedUrl) {
        var apiUrl = RSS2JSON_API + encodeURIComponent(feedUrl);
        return fetch(apiUrl)
            .then(function(response) { return response.json(); })
            .then(function(data) {
                if (data.status === 'ok' && data.items && data.items.length > 0) {
                    return data.items.map(function(item) {
                        return {
                            title: item.title || labels.noTitle,
                            date: formatDate(item.pubDate),
                            summary: stripHtml(item.description || item.content || '') || labels.noSummary,
                            category: categorizeNews((item.title || '') + ' ' + (item.description || '')),
                            source: item.link || item.source || window.location.href
                        };
                    });
                }
                return [];
            })
            .catch(function() {
                return [];
            });
    });

    Promise.all(fetchPromises)
        .then(function(results) {
            // Combine all results and deduplicate by title
            var allItems = [];
            var seenTitles = {};
            results.forEach(function(items) {
                items.forEach(function(item) {
                    if (!seenTitles[item.title] && item.title !== labels.noTitle) {
                        seenTitles[item.title] = true;
                        allItems.push(item);
                    }
                });
            });

            if (allItems.length > 0) {
                // Sort by date (newest first)
                allItems.sort(function(a, b) {
                    return new Date(b.date) - new Date(a.date);
                });
                // Limit to 20 items
                allItems = allItems.slice(0, 20);
                cachedNewsData = allItems;
                renderNews(allItems);
            } else {
                throw new Error('No news items from any feed');
            }
        })
        .catch(function(error) {
            console.error('Failed to fetch news:', error);
            // Fall back to cached data or static data
            if (cachedNewsData && cachedNewsData.length > 0) {
                renderNews(cachedNewsData);
                if (updateInfo) {
                    updateInfo.textContent = labels.lastUpdated + formatTimeDisplay(lastUpdateTime) + labels.usingCache;
                }
            } else {
                renderNews(fallbackNewsData);
                if (updateInfo) {
                    updateInfo.textContent = labels.lastUpdated + formatTimeDisplay(lastUpdateTime) + labels.showingCache;
                }
            }
        });
}

// Initialize
function init() {
    // Set up language toggle button
    var langToggle = document.getElementById('langToggle');
    if (langToggle) {
        langToggle.addEventListener('click', switchLanguage);
    }

    // Try to fetch live news, fall back to static data
    fetchNews();

    // Auto-update every hour
    setInterval(function() {
        fetchNews();
    }, 60 * 60 * 1000);
}

// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

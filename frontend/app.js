/**
 * РЛЭ Web App — интерактивный интерфейс выбора самолётов и разделов РЛЭ.
 * Работает как Telegram Web App или standalone в браузере.
 */

// ==================== State ====================
const state = {
    aircrafts: [],       // loaded from API or embedded
    currentScreen: 'welcome',  // welcome | list | detail | content
    selectedAircraftId: null,
    selectedSectionId: null,
};

// ==================== DOM refs ====================
const appMain = document.getElementById('appMain');
const headerTitle = document.getElementById('headerTitle');
const btnBack = document.getElementById('btnBack');
const loadingOverlay = document.getElementById('loadingOverlay');

// ==================== API ====================
async function fetchJSON(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error('Fetch error:', err);
        return null;
    }
}

async function loadAircrafts() {
    showLoading(true);
    // Try API first, fallback to embedded data
    const data = await fetchJSON('/api/aircrafts');
    if (data && data.status === 'ok') {
        state.aircrafts = data.data;
    } else {
        // Embedded fallback — will be populated by init()
        state.aircrafts = [];
    }
    showLoading(false);
}

async function loadSections(aircraftId) {
    const data = await fetchJSON(`/api/sections/${aircraftId}`);
    return (data && data.status === 'ok') ? data.data : null;
}

async function loadSection(aircraftId, sectionId) {
    const data = await fetchJSON(`/api/section/${aircraftId}/${sectionId}`);
    return (data && data.status === 'ok') ? data.data : null;
}

// ==================== Embedded Data (fallback) ====================
const EMBEDDED_DATA = [
    {
        id: "su-35",
        name: "Су-35С",
        designation: "Многоцелевой истребитель 4++ поколения",
        description: "Истребитель с суперкруизом, управляемым тягловым вектором и увеличенной дальностью.",
        image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Sukhoi_Su-35S_at_MAC-2017.jpg/800px-Sukhoi_Su-35S_at_MAC-2017.jpg",
        sections: [
            { id: "general", title: "Общие сведения", icon: "📋", content: { "назначение": "Многоцелевой истребитель для завоевания превосходства в воздухе.", "экипаж": "1 пилот", "первый_полёт": "2008 год (T-10М-3)", "разработчик": "КБ Сухого, Москва/Комсомольск-на-Амуре" }, details: ["Самолёт создан на базе Су-27М и является глубокой модернизацией платформы.", "Получил обозначение 4++ поколения благодаря интеграции элементов 5-го поколения."] },
            { id: "specs", title: "Технические характеристики", icon: "📐", content: { "размах_крыла": "14.7 м", "длина": "21.9 м", "масса_пустого": "18 300 кг", "макс_взлётная": "34 500 кг" }, details: ["Крыло стреловидностью 42.5° по линии 25% хорды.", "Имеет переднее горизонтальное оперение (ПГО)."] },
            { id: "performance", title: "Лётные характеристики", icon: "🚀", content: { "макс_скорость": "Mach 2.25", "суперкруиз": "Mach 1.8", "практический_потолок": "20 000 м", "рабочий_радиус": "700 км" }, details: ["Суперкруиз Mach 1.8 — сверхзвуковой полёт без форсажа.", "Максимальная перегрузка: +9G / -3.5G."] },
            { id: "limitations", title: "Ограничения", icon: "⚠️", content: { "макс_перегрузка": "+9G / -3.5G", "макс_скорость": "Mach 2.25", "мин_скорость_посадки": "~240 км/ч" }, details: ["Ограничение по перегрузке зависит от Mach-числа.", "При полёте на сверхзвуке с отклонением руля >30° возможна потеря устойчивости."] },
            { id: "systems", title: "Бортовое оборудование", icon: "📡", content: { "рлс": "Н035 «Белка» (АФАР)", "кис": "КИС «Арбалет»", "кабины": "6 цветных МКИ" }, details: ["РЛС Н035 Byelka — импульсно-доплеровская с АФАР на GaN-модулях.", "Кабина полностью стёклянная."] },
            { id: "armament", title: "Вооружение и подвеска", icon: "🎯", content: { "пушка": "30 мм ГШ-30-1 (150 снарядов)", "точки_подвески": "12 точек, до 8 000 кг", "ракеты_вн": "Р-77, Р-73Э, Р-37М" }, details: ["Максимальная нагрузка на внешних подвесках — 8 000 кг.", "Внутренние ПВБ: до 4 ракет Р-77."] },
        ],
    },
    {
        id: "f-22",
        name: "F-22 Raptor",
        designation: "Истребитель превосходства в воздухе 5 поколения (США)",
        description: "Стелс-истребитель с суперкруизом, сверхманёвренностью и интегрированной авионикой.",
        image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/F-22_Raptor_388th_Fighter_Wing_%28cropped%29.jpg/440px-F-22_Raptor_388th_Fighter_Wing_%28cropped%29.jpg",
        sections: [
            { id: "general", title: "Общие сведения", icon: "📋", content: { "назначение": "Завоевание превосходства в воздухе, удар по наземным целям.", "экипаж": "1 пилот", "первый_полёт": "1997 год (YF-22)", "разработчик": "Lockheed Skunk Works / Boeing" }, details: ["Первый в мире серийный истребитель 5-го поколения.", "Стоимость единицы ~$150 млн."] },
            { id: "specs", title: "Технические характеристики", icon: "📐", content: { "размах_крыла": "13.56 м", "длина": "18.92 м", "масса_пустого": "19 700 кг", "макс_взлётная": "38 000 кг" }, details: ["Крыло трапециевидное с передней кромкой под углом 42.5°.", "Сопла треугольной формы для снижения ИК-сигнатуры."] },
            { id: "performance", title: "Лётные характеристики", icon: "🚀", content: { "макс_скорость": "Mach 2.25", "суперкруиз": "Mach 1.82", "практический_потолок": "19 800 м", "рабочий_радиус": "760 км" }, details: ["Суперкруиз Mach 1.82 — один из лучших среди всех истребителей.", "Рабочий радиус 760 км без подвесных баков."] },
            { id: "limitations", title: "Ограничения", icon: "⚠️", content: { "макс_перегрузка": "+9G / -4G", "макс_скорость": "Mach 2.25", "мин_высота_створов": "~15 м AGL" }, details: ["Ограничение по скорости при открытии створок — 257 км/ч.", "При перегрузке >6G — обязательный G-костюм."] },
            { id: "systems", title: "Бортовое оборудование", icon: "📡", content: { "рлс": "AN/APG-77(V)1 АФАР X-band", "es": "ALR-94 РЭБ 360°", "data_link": "IFDL + MADL" }, details: ["РЛС AN/APG-77(V)1 — стелс-АФАР с LPI-режимами.", "ALR-94 обнаружение РЛС противника до 560 км."] },
            { id: "armament", title: "Вооружение и подвеска", icon: "🎯", content: { "пушка": "20 мм M61A2 Vulcan (480 снарядов)", "внутренние_отсеки": "2 отсека", "ракеты_вн": "AIM-120 AMRAAM (до 6)" }, details: ["Внутренний отсек: до 4× AIM-120 или 2× GBU-32.", "Боковой отсек: 2× AIM-9 Sidewinder."] },
        ],
    },
    {
        id: "su-57",
        name: "Су-57",
        designation: "Многоцелевой истребитель 5 поколения",
        description: "Истребитель 5 поколения с суперкруизом, АФАР, стелс-технологиями.",
        image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Sukhoi_Su-57_%28051%29_at_MAC-2019.jpg/800px-Sukhoi_Su-57_%28051%29_at_MAC-2019.jpg",
        sections: [
            { id: "general", title: "Общие сведения", icon: "📋", content: { "назначение": "Завоевание превосходства в воздухе, поражение наземных целей.", "экипаж": "1 пилот", "первый_полёт": "2010 год (T-50)", "разработчик": "КБ Сухого, Комсомольск-на-Амуре" }, details: ["Разработан по программе ТПП (Технология перспективного истребителя).", "Комплекс РЛС «Белка» — уникальная схема с хвостовой АФАР."] },
            { id: "specs", title: "Технические характеристики", icon: "📐", content: { "размах_крыла": "14.0 м", "длина": "19.8 м", "масса_пустого": "18 500 кг", "макс_взлётная": "35 000 кг" }, details: ["Крыло фиксированное, стреловидность ~47°.", "Сопла с адаптивным профилем для снижения ИК-сигнатуры."] },
            { id: "performance", title: "Лётные характеристики", icon: "🚀", content: { "макс_скорость": "Mach 2.0+", "суперкруиз": "Mach 1.3–1.6", "практический_потолок": "20 000 м", "рабочий_радиус": "1 200 км" }, details: ["Суперкруиз Mach 1.3–1.6 зависит от конфигурации.", "Перегрузка: +9G / -3G."] },
            { id: "limitations", title: "Ограничения", icon: "⚠️", content: { "макс_перегрузка": "+9G / -3G", "макс_скорость": "Mach 2.0+", "макс_угол_атаки": "до 60° (с ПГО)" }, details: ["Ограничение по перегрузке зависит от Mach-числа.", "При угле атаки >35° — активное управление с помощью ПГО."] },
            { id: "systems", title: "Бортовое оборудование", icon: "📡", content: { "рлс_носовая": "Н036 (Л/S-band АФАР)", "рлс_хвостовая": "К-диапазонная АФАР ЭПК", "кис": "ИО-22" }, details: ["Н036 — обзорная РЛС с АФАР, обнаружение ВТ на 450 км.", "Хвостовая К-диапазонная АФАР — обзор задней полусферы."] },
            { id: "armament", title: "Вооружение и подвеска", icon: "🎯", content: { "пушка": "30 мм ГШ-30-1 (150 снарядов)", "внутренние_отсеки": "4 отсека", "ракеты_вн": "Р-77, Р-37М, Р-73Э" }, details: ["Внутренние ПВБ: до 4 ракет Р-77.", "10 внешних точек подвески, до 10 000 кг."] },
        ],
    },
];

// ==================== Loading ====================
function showLoading(show) {
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

// ==================== Navigation ====================
function navigateTo(screen, data = {}) {
    state.currentScreen = screen;

    if (data.aircraftId) state.selectedAircraftId = data.aircraftId;
    if (data.sectionId) state.selectedSectionId = data.sectionId;

    updateHeader();
    renderScreen();
}

function goBack() {
    if (state.currentScreen === 'content') {
        navigateTo('detail', { aircraftId: state.selectedAircraftId });
    } else if (state.currentScreen === 'detail') {
        navigateTo('list');
    }
}

function updateHeader() {
    const titles = {
        welcome: 'РЛЭ Самолётов',
        list: 'Выберите самолёт',
        detail: state.selectedAircraftId ? getAircraftName(state.selectedAircraftId) : '',
        content: state.selectedSectionId || '',
    };
    headerTitle.textContent = titles[state.currentScreen] || '';

    if (state.currentScreen === 'welcome') {
        btnBack.style.display = 'none';
    } else {
        btnBack.style.display = 'block';
    }
}

function getAircraftName(id) {
    const ac = EMBEDDED_DATA.find(a => a.id === id);
    return ac ? ac.name : '';
}

function getAircraftEmoji(id) {
    const emojis = { 'su-35': '✈️', 'f-22': '🦅', 'su-57': '🛩️' };
    return emojis[id] || '✈️';
}

function getAircraftById(id) {
    return EMBEDDED_DATA.find(a => a.id === id);
}

// ==================== Rendering ====================
function renderScreen() {
    switch (state.currentScreen) {
        case 'welcome': renderWelcome(); break;
        case 'list': renderList(); break;
        case 'detail': renderDetail(); break;
        case 'content': renderContent(); break;
    }
}

// --- Welcome Screen ---
function renderWelcome() {
    appMain.innerHTML = `
        <div class="screen active">
            <div class="welcome-hero">
                <span class="welcome-icon">🛩️</span>
                <h2 class="welcome-title">Руководство по лётной эксплуатации</h2>
                <p class="welcome-subtitle">Выберите самолёт для изучения разделов РЛЭ: характеристики, ограничения, системы и вооружение.</p>
            </div>
            <div class="aircraft-grid" id="aircraftGrid"></div>
        </div>
    `;

    const grid = document.getElementById('aircraftGrid');
    EMBEDDED_DATA.forEach(ac => {
        const card = document.createElement('div');
        card.className = 'aircraft-card';
        card.innerHTML = `
            <div class="card-image-container">
                <img class="card-image" src="${ac.image_url}" alt="${ac.name}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="card-fallback">${getAircraftEmoji(ac.id)}</div>
            </div>
            <div class="card-name">${ac.name}</div>
            <div class="card-designation">${ac.designation}</div>
            <div class="card-desc">${ac.description}</div>
            <div class="card-meta">
                <span class="meta-badge">📖 ${ac.sections.length} разделов</span>
            </div>
        `;
        card.addEventListener('click', () => {
            navigateTo('detail', { aircraftId: ac.id });
        });
        grid.appendChild(card);
    });
}

// --- List Screen (same as welcome, for navigation consistency) ---
function renderList() {
    renderWelcome();
}

// --- Detail Screen (section list for an aircraft) ---
async function renderDetail() {
    const ac = EMBEDDED_DATA.find(a => a.id === state.selectedAircraftId);
    if (!ac) {
        navigateTo('list');
        return;
    }

    appMain.innerHTML = `
        <div class="screen active">
            <div class="detail-hero">
                <img class="detail-image" src="${ac.image_url}" alt="${ac.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="detail-fallback">${getAircraftEmoji(ac.id)}</div>
            </div>
            <div class="detail-header">
                <h2 class="detail-name">${ac.name}</h2>
                <div class="detail-designation">${ac.designation}</div>
                <p class="detail-desc">${ac.description}</p>
            </div>
            <div class="section-list" id="sectionList"></div>
        </div>
    `;

    const list = document.getElementById('sectionList');
    ac.sections.forEach((sec, i) => {
        const item = document.createElement('div');
        item.className = 'section-item';
        item.style.animationDelay = `${i * 0.05}s`;
        item.innerHTML = `
            <span class="section-icon">${sec.icon}</span>
            <div class="section-info">
                <div class="section-title-text">${sec.title}</div>
                <div class="section-subtitle">Нажмите для просмотра</div>
            </div>
            <span class="section-arrow">›</span>
        `;
        item.addEventListener('click', () => {
            navigateTo('content', { aircraftId: ac.id, sectionId: sec.id });
        });
        list.appendChild(item);
    });
}

// --- Content Screen (detailed section view) ---
async function renderContent() {
    const ac = EMBEDDED_DATA.find(a => a.id === state.selectedAircraftId);
    if (!ac) return;

    const sec = ac.sections.find(s => s.id === state.selectedSectionId);
    if (!sec) {
        navigateTo('detail', { aircraftId: ac.id });
        return;
    }

    // Build data table rows
    let tableRows = '';
    for (const [key, value] of Object.entries(sec.content)) {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        tableRows += `
            <div class="data-row">
                <span class="data-label">${label}</span>
                <span class="data-value">${value}</span>
            </div>
        `;
    }

    // Build details list
    let detailsHTML = '';
    if (sec.details && sec.details.length > 0) {
        detailsHTML = `
            <div class="details-list">
                <div class="details-title">Дополнительная информация</div>
                ${sec.details.map(d => `
                    <div class="detail-item">
                        <span class="detail-bullet">▸</span>
                        <span class="detail-text">${d}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    appMain.innerHTML = `
        <div class="screen active content-screen">
            <div class="content-title-bar">
                <span class="content-icon">${sec.icon}</span>
                <h2 class="content-title-text">${sec.title}</h2>
            </div>
            ${tableRows ? `<div class="data-table">${tableRows}</div>` : ''}
            ${detailsHTML}
        </div>
    `;

    // Update header with section title
    headerTitle.textContent = `${ac.name} — ${sec.title}`;
}

// ==================== Event Listeners ====================
btnBack.addEventListener('click', goBack);

// ==================== Init ====================
async function init() {
    // Check if running inside Telegram Web App
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.ready();
        tg.expand();
        tg.setHeaderColor('#0a0e17');
        tg.setBackgroundColor('#0a0e17');

        // Send data back to bot on close
        tg.close();
    }

    // Try loading from API, fallback to embedded
    await loadAircrafts();

    if (state.aircrafts.length === 0) {
        // Use embedded data
        state.aircrafts = EMBEDDED_DATA;
    }

    navigateTo('welcome');
}

init();

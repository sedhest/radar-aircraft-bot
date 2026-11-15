/**
 * РЛЭ Web App — интерактивный интерфейс выбора самолётов МГА.
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
        id: "cessna-172",
        name: "Cessna 172 Skyhawk",
        designation: "Лёгкий четырёхместный самолёт МГА",
        description: "Самый массовый учебно-тренировочный самолёт в мире. Идеален для начального обучения пилотов.",
        image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Cessna_172S_Skyhawk_SP_%2823690480601%29.jpg/800px-Cessna_172S_Skyhawk_SP_%2823690480601%29.jpg",
        sections: [
            { id: "general", title: "Общие сведения", icon: "📋", content: { "назначение": "Четырёхместный лёгкий самолёт для обучения, частных и коммерческих полётов.", "экипаж": "1–2 пилота", "пассажиры": "3 человека", "первый_полёт": "1955 год (модель 172)", "разработчик": "Cessna Aircraft Company, США", "серийное_производство": "с 1956 года (непрерывно)" }, details: ["Cessna 172 — самый массовый самолёт в истории авиации, выпущено более 45 000 экземпляров.", "Производство продолжается по сей день в новом формате (Skyhawk SP).", "Используется авиакомпаниями и частными школами для обучения пилотов во всём мире."] },
            { id: "specs", title: "Технические характеристики", icon: "📐", content: { "размах_крыла": "11.0 м", "длина": "8.3 м", "высота": "2.7 м", "площадь_крыла": "16.2 м²", "масса_пустого": "753 кг", "макс_взлётная": "1 111 кг" }, details: ["Крыло низкорасположенное, прямое, с закрылками.", "Шасси классическое (хвостовое колесо), неубирающееся.", "Конструкция планера — силовой монокок из алюминиевых сплавов."] },
            { id: "performance", title: "Лётные характеристики", icon: "🚀", content: { "макс_скорость": "302 км/ч (163 узла)", "крейсерская_скорость": "246 км/ч (133 узла)", "практический_потолок": "4 100 м (13 500 футов)", "дальность": "1 289 км с учётом резерва", "вертикальная_скорость": "7.3 м/с (1 430 фт/мин)" }, details: ["Крейсерская скорость на высоте 2 700 м — около 220–246 км/ч.", "Дальность увеличивается с использованием дополнительных баков (опция).", "Потолок ограничен давлением и richness mixture."] },
            { id: "limitations", title: "Ограничения", icon: "⚠️", content: { "макс_перегрузка": "+4G / -2G", "макс_скорость_с_закрылками": "204 км/ч (Vfe)", "макс_скорость_шасси": "302 км/ч (Vno)", "макс_давление_в_баках": "по инструкции производителя", "минимальная_скорость_посадки": "~96 км/ч (с закрылками)" }, details: ["Максимальная перегрузка +4G / -2G — ограничение по классу «общего назначения».", "Vne (never exceed speed) — 302 км/ч, красный черта на спидометре.", "При полёте с перегрузкой >3.8G возможна деформация планера."] },
            { id: "systems", title: "Бортовое оборудование", icon: "📡", content: { "приборы": "Стандартная «шестёрка» ЭИП (ASI, HI, AI, VSI, CDI, HDG)", "радио_оборудование": "VHF COM, VFR NAV, DME (опция)", "автоматика": "Автопилот (опция G1000 / Garmin)", "электрическая_система": "28V DC, генератор 60A", "освещение": "Стандартное навигационное и приборное" }, details: ["Базовая комплектация — аналоговые приборы.", "Опция G1000 NXi — полностью цифровая кабина с двумя дисплеями.", "Система зажигания — магнитная (Slick/Scintilla)."] },
            { id: "engine", title: "Двигатель и топливная система", icon: "⚙️", content: { "двигатель": "Lycoming IO-360-L2A, 180 л.с.", "тип_двигателя": "Поршневой, оппозитный, 4 цил.", "расход_топлива": "~25 л/ч (крейсерский режим)", "основные_баки": "2 × 71 л (крыльевые)", "дополнительные_баки": "Опция: 2 × 38 л (в салоне)" }, details: ["Двигатель с впрыском топлива (fuel injected), без карбюратора.", "Топливо AVGAS 100LL или Jet A (с ограничениями).", "Маслосистема: сухая картерная, объём масла 8 кварт."] },
        ],
    },
    {
        id: "piper-pa28",
        name: "Piper PA-28 Cherokee",
        designation: "Лёгкий четырёхместный самолёт МГА",
        description: "Надёжный и экономичный самолёт для обучения, личных полётов и аэротакси.",
        image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Piper_PA-28-161_Cherokee_AA.jpg/800px-Piper_PA-28-161_Cherokee_AA.jpg",
        sections: [
            { id: "general", title: "Общие сведения", icon: "📋", content: { "назначение": "Четырёхместный самолёт общего назначения для обучения и частных полётов.", "экипаж": "1–2 пилота", "пассажиры": "3 человека", "первый_полёт": "1960 год (PA-28-140)", "разработчик": "Piper Aircraft, Inc., США", "серийное_производство": "с 1960 года" }, details: ["PA-28 — один из самых распространённых учебных самолётов в мире.", "Серия включает модификации от 140 до 236 л.с.", "Известен надёжностью и простотой обслуживания."] },
            { id: "specs", title: "Технические характеристики", icon: "📐", content: { "размах_крыла": "10.97 м (PA-28-161)", "длина": "6.63 м", "высота": "2.16 м", "площадь_крыла": "15.9 м²", "масса_пустого": "680 кг (PA-28-161)", "макс_взлётная": "1 089 кг" }, details: ["Крыло низкорасположенное, прямое, с закрылками.", "Шасси классическое (хвостовое колесо), неубирающееся.", "Конструкция — полумонокок из алюминиевых сплавов."] },
            { id: "performance", title: "Лётные характеристики", icon: "🚀", content: { "макс_скорость": "230 км/ч (124 узла)", "крейсерская_скорость": "214 км/ч (115 узла)", "практический_потолок": "4 115 м (13 500 футов)", "дальность": "~1 185 км с основными баками", "вертикальная_скорость": "5.6 м/с (1 100 фт/мин)" }, details: ["Крейсерская скорость на высоте 1 500 м — около 200 км/ч.", "Дальность ограничена ёмкостью баков, с доп. баками — больше.", "Потолок зависит от модификации и массы."] },
            { id: "limitations", title: "Ограничения", icon: "⚠️", content: { "макс_перегрузка": "+4G / -2G", "макс_скорость_с_закрылками": "194 км/ч (Vfe)", "макс_скорость_шасси": "230 км/ч (Vno)", "макс_скорость_открытия_двери": "~160 км/ч", "минимальная_скорость_посадки": "~94 км/ч (с закрылками)" }, details: ["Максимальная перегрузка +4G / -2G — класс «общего назначения».", "Vne (never exceed speed) зависит от модификации, обычно 230–268 км/ч.", "При полёте с перегрузкой >3.8G возможна деформация планера."] },
            { id: "systems", title: "Бортовое оборудование", icon: "📡", content: { "приборы": "Стандартная «шестёрка» ЭИП (ASI, HI, AI, VSI, CDI, HDG)", "радио_оборудование": "VHF COM, NAV, DME (опция)", "автоматика": "Автопилот (опция)", "электрическая_система": "28V DC, генератор 40–60A", "освещение": "Стандартное навигационное и приборное" }, details: ["Базовая комплектация — аналоговые приборы.", "Опция Garmin G1000 — полностью цифровая кабина.", "Система зажигания — магнитная (Slick/Scintilla)."] },
            { id: "engine", title: "Двигатель и топливная система", icon: "⚙️", content: { "двигатель": "Lycoming O-320-E2D, 160 л.с.", "тип_двигателя": "Поршневой, оппозитный, 4 цил.", "расход_топлива": "~22 л/ч (крейсерский режим)", "основные_баки": "2 × 68 л (крыльевые)", "дополнительные_баки": "Опция: 2 × 30 л" }, details: ["Двигатель с карбюратором, требует предварительного прогрева.", "Топливо AVGAS 100LL.", "Маслосистема: мокрый картер, объём масла 8 кварт."] },
        ],
    },
    {
        id: "diamond-da40",
        name: "Diamond DA40 Star",
        designation: "Современный четырёхместный самолёт МГА",
        description: "Композитный самолёт с дизельным двигателем и аэродинамически совершенным дизайном.",
        image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Diamond_DA40_D-IEHL_%2815376936752%29.jpg/800px-Diamond_DA40_D-IEHL_%2815376936752%29.jpg",
        sections: [
            { id: "general", title: "Общие сведения", icon: "📋", content: { "назначение": "Четырёхместный самолёт для обучения, частных и коммерческих полётов.", "экипаж": "1–2 пилота", "пассажиры": "3 человека", "первый_полёт": "1997 год (DA40)", "разработчик": "Diamond Aircraft Industries, Австрия", "серийное_производство": "с 2000 года" }, details: ["DA40 — один из первых серийных самолётов с композитным фюзеляжем и крылом.", "Используется в учебных программах по всему миру.", "Отличается низким расходом топлива и высокой надёжностью."] },
            { id: "specs", title: "Технические характеристики", icon: "📐", content: { "размах_крыла": "13.34 м", "длина": "8.52 м", "высота": "2.67 м", "площадь_крыла": "15.6 м²", "масса_пустого": "805 кг (DA40 NG)", "макс_взлётная": "1 290 кг" }, details: ["Крыло композитное, низкорасположенное, с закрылками.", "Шасси классическое (хвостовое колесо), неубирающееся.", "Конструкция планера — углепластик и стеклопластик."] },
            { id: "performance", title: "Лётные характеристики", icon: "🚀", content: { "макс_скорость": "285 км/ч (154 узла)", "крейсерская_скорость": "256 км/ч (138 узла)", "практический_потолок": "4 725 м (15 500 футов)", "дальность": "~1 980 км с доп. баками", "вертикальная_скорость": "6.1 м/с (1 200 фт/мин)" }, details: ["Крейсерская скорость на высоте 3 000 м — около 240–256 км/ч.", "Дальность значительно больше, чем у аналогов с бензиновыми двигателями.", "Потолок ограничен давлением и richness mixture."] },
            { id: "limitations", title: "Ограничения", icon: "⚠️", content: { "макс_перегрузка": "+4G / -2G", "макс_скорость_с_закрылками": "222 км/ч (Vfe)", "макс_скорость_шасси": "285 км/ч (Vno)", "макс_скорость_открытия_двери": "~190 км/ч", "минимальная_скорость_посадки": "~104 км/ч (с закрылками)" }, details: ["Максимальная перегрузка +4G / -2G — класс «общего назначения».", "Vne (never exceed speed) — 285 км/ч, красный черта на спидометре.", "При полёте с перегрузкой >3.8G возможна деформация композитного крыла."] },
            { id: "systems", title: "Бортовое оборудование", icon: "📡", content: { "приборы": "Garmin G1000 NXi (стандарт на DA40 NG)", "радио_оборудование": "VHF COM, NAV, ADS-B Out", "автоматика": "Автопилот Garmin GFC 700", "электрическая_система": "28V DC, генератор 70A", "освещение": "LED навигационное и приборное" }, details: ["Стандартная комплектация — полностью цифровая кабина G1000 NXi.", "ADS-B Out обязателен для полётов в контролируемом воздушном пространстве.", "Система зажигания — электронная (Magneti Marelli)."] },
            { id: "engine", title: "Двигатель и топливная система", icon: "⚙️", content: { "двигатель": "Austro Engine AE300, 180 л.с.", "тип_двигателя": "Турбодизель, 4 цил., рядный", "расход_топлива": "~19 л/ч (крейсерский режим)", "основные_баки": "2 × 73 л (крыльевые)", "дополнительные_баки": "Опция: 2 × 45 л" }, details: ["Дизельный двигатель с турбонаддувом, работает на AVGAS или Jet A-1.", "Расход топлива на 20–30% ниже, чем у бензиновых аналогов.", "Маслосистема: сухая картерная, объём масла 6.5 кварт."] },
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
    const emojis = { 'cessna-172': '✈️', 'piper-pa28': '🛩️', 'diamond-da40': '🌟' };
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
                <p class="welcome-subtitle">Выберите самолёт для изучения разделов РЛЭ: характеристики, ограничения, системы и двигатель.</p>
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

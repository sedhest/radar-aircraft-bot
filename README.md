# 🛩️ РЛЭ Самолётов — Telegram Mini App

Интерактивное веб-приложение для изучения Руководства по Лётной Эксплуатации (РЛЭ) трёх самолётов:
- **Су-35С** — многоцелевой истребитель 4++ поколения
- **F-22 Raptor** — истребитель превосходства в воздухе 5-го поколения (США)
- **Су-57** — многоцелевой истебитель 5-го поколения

## 📂 Структура проекта

```
radar-aircraft-bot/
├── frontend/
│   ├── index.html      # Главная страница
│   ├── app.js          # Логика приложения (JS)
│   └── styles.css      # Стили (CSS)
├── backend/
│   ├── data.py         # Данные самолётов и разделов РЛЭ
│   └── bot.py          # Telegram-бот (python-telegram-bot)
├── server.py           # HTTP-сервер для локальной разработки
├── wsgi.py             # WSGI-обёртка для деплоя
├── Procfile            # Конфигурация для Heroku/Render
├── requirements.txt    # Python-зависимости
└── README.md           # Этот файл
```

## 🚀 Быстрый старт (локально)

### 1. Установка зависимостей
```bash
cd radar-aircraft-bot
pip install -r requirements.txt
```

### 2. Запуск сервера
```bash
python server.py
# Откроется http://localhost:8080
```

### 3. Тестирование в браузере
Откройте `http://localhost:8080` — приложение работает standalone без Telegram.

## 🌐 Деплой на Render (бесплатно)

### Шаг 1: GitHub-репозиторий
```bash
git init
git add .
git commit -m "Initial: РЛЭ Web App"
# Создайте репо на github.com, затем:
git remote add origin https://github.com/ВАШ_НИК/radar-rle-app.git
git push -u origin main
```

### Шаг 2: Render.com
1. Зарегистрируйтесь на [render.com](https://render.com) через GitHub
2. **New → Web Service** → выберите репозиторий
3. Настройки:

| Поле | Значение |
|---|---|
| Name | `radar-rle-app` (любое уникальное) |
| Region | Frankfurt (ближе к РФ) |
| Environment | Python 3 |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `gunicorn wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120` |

4. **Deploy** → через минуту получите URL вида `https://radar-rle-app.onrender.com`

### Альтернатива: Railway.app
1. Иди на [railway.app](https://railway.app)
2. New Project → GitHub Repo
3. Railway автоматически определит Python и Procfile
4. Получишь URL вида `https://radar-rle-app.railway.app`

## 📱 Настройка Telegram-бота

### Вариант A: Через BotFather (Menu Button)
1. Иди к [@BotFather](https://t.me/BotFather)
2. `/mybots → Выбери бота → Bot Settings → Menu Button`
3. Отправь:
   - Текст кнопки: `📖 РЛЭ Самолётов`
   - URL: `https://ТВОЙ_ДОМЕН.onrender.com/`

### Вариант B: Через код (inline-кнопка)
В `backend/bot.py` измени переменную:
```python
WEB_APP_URL = "https://ТВОЙ_ДОМЕН.onrender.com/"  # Твой URL с https://
```

Перезапусти бота:
```bash
BOT_TOKEN=твой_токен WEB_APP_URL=https://... python backend/bot.py
```

## 🔧 Переменные окружения

| Переменная | Описание | По умолчанию |
|---|---|---|
| `PORT` | Порт сервера | `8080` |
| `BOT_TOKEN` | Токен от BotFather | — |
| `WEB_APP_URL` | URL Web App для бота | — |

## 📡 API Endpoints

| Endpoint | Описание |
|---|---|
| `GET /api/aircrafts` | Список всех самолётов |
| `GET /api/sections/{id}` | Разделы РЛЭ конкретного самолёта |
| `GET /api/section/{ac}/{sec}` | Данные конкретного раздела |

## 🎨 Возможности приложения

- ✅ Выбор из 3 самолётов с фотографиями
- ✅ 6 разделов РЛЭ на каждый самолёт:
  - Общие сведения
  - Технические характеристики
  - Лётные характеристики
  - Ограничения
  - Бортовое оборудование (РЛС/РЛЭ)
  - Вооружение и подвеска
- ✅ Адаптивный дизайн (мобильные, планшеты, десктоп)
- ✅ Работает внутри Telegram и standalone в браузере
- ✅ Бесплатный хостинг

## 🛠 Доработка

### Добавить новый самолёт
1. В `backend/data.py` добавь данные в список `AIRCRAFT_DATA`
2. Добавь фото в `frontend/app.js` → `EMBEDDED_DATA`
3. Перезапусти сервер

### Изменить разделы РЛЭ
Редактируй объекты `sections` в `EMBEDDED_DATA` (app.js) и `AIRCRAFT_DATA` (data.py).

## 📝 Лицензия

Пробный проект — свободная доработка.

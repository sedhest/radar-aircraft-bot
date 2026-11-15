"""
Telegram-бот с Web App для РЛЭ самолётов.
Запуск: python bot.py
Переменная окружения: BOT_TOKEN — токен от @BotFather
"""

import os
import json
import logging
from pathlib import Path

from telegram import (
    Update,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    WebAppInfo,
)
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    ContextTypes,
)

from data import list_aircrafts, get_aircraft_sections, get_aircraft_section

# ==================== Config ====================

BOT_TOKEN = os.environ.get("BOT_TOKEN", "YOUR_BOT_TOKEN_HERE")
WEB_APP_URL = os.environ.get(
    "WEB_APP_URL",
    "https://your-domain.com/radar-aircraft-app/",  # Замените на ваш URL фронтенда
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ==================== Handlers ====================

async def start_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /start — кнопка запуска Web App."""
    web_app = InlineKeyboardButton(
        text="📖 Открыть РЛЭ (Web App)",
        web_app=WebAppInfo(url=WEB_APP_URL),
    )

    keyboard = [[web_app]]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(
        "Добро пожаловать! 🛩️\n\n"
        "Выберите самолёт и изучите разделы РЛЭ в интерактивном режиме.\n\n"
        "Нажмите кнопку ниже для запуска:",
        reply_markup=reply_markup,
    )


async def web_app_button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка нажатия кнопки Web App (дубль для надёжности)."""
    web_app = InlineKeyboardButton(
        text="📖 Открыть РЛЭ (Web App)",
        web_app=WebAppInfo(url=WEB_APP_URL),
    )

    keyboard = [[web_app]]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.callback_query.edit_message_text(
        "Выберите самолёт и изучите разделы РЛЭ в интерактивном режиме.\n\n"
        "Нажмите кнопку ниже для запуска:",
        reply_markup=reply_markup,
    )


async def api_aircrafts_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """API endpoint: /api/aircrafts — список самолётов."""
    aircrafts = list_aircrafts()
    await update.message.reply_text(
        json.dumps({"status": "ok", "data": aircrafts}, ensure_ascii=False),
    )


async def api_sections_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """API endpoint: /api/sections/<aircraft_id> — разделы РЛЭ."""
    if len(context.args) < 1:
        await update.message.reply_text(json.dumps({"status": "error", "message": "Укажите aircraft_id"}))
        return

    aircraft_id = context.args[0]
    sections = get_aircraft_sections(aircraft_id)

    if not sections:
        await update.message.reply_text(json.dumps({"status": "error", "message": "Самолёт не найден"}))
        return

    await update.message.reply_text(
        json.dumps({"status": "ok", "data": sections}, ensure_ascii=False),
    )


async def api_section_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """API endpoint: /api/section/<aircraft_id>/<section_id> — один раздел."""
    if len(context.args) < 2:
        await update.message.reply_text(json.dumps({"status": "error", "message": "Укажите aircraft_id и section_id"}))
        return

    aircraft_id = context.args[0]
    section_id = context.args[1]
    section = get_aircraft_section(aircraft_id, section_id)

    if not section:
        await update.message.reply_text(json.dumps({"status": "error", "message": "Раздел не найден"}))
        return

    await update.message.reply_text(
        json.dumps({"status": "ok", "data": section}, ensure_ascii=False),
    )


# ==================== Inline keyboard (fallback, без Web App) ====================

async def build_aircraft_keyboard() -> InlineKeyboardMarkup:
    """Собирает inline-кнопки для выбора самолёта."""
    aircrafts = list_aircrafts()
    rows = []
    for ac in aircrafts:
        btn = InlineKeyboardButton(
            f"{ac['image_emoji']} {ac['name']}",
            callback_data=f"aircraft:{ac['id']}",
        )
        rows.append([btn])
    return InlineKeyboardMarkup(rows)


async def build_sections_keyboard(aircraft_id: str, aircraft_name: str) -> InlineKeyboardMarkup:
    """Собирает inline-кнопки для выбора раздела РЛЭ."""
    sections = get_aircraft_sections(aircraft_id)
    if not sections:
        return InlineKeyboardMarkup([["🔙 Назад", callback_data="back"]])

    rows = []
    for s in sections:
        btn = InlineKeyboardButton(
            f"{s['icon']} {s['title']}",
            callback_data=f"section:{aircraft_id}:{s['id']}",
        )
        rows.append([btn])

    rows.append([InlineKeyboardButton("🔙 Назад к самолётам", callback_data="back_to_aircrafts")])
    return InlineKeyboardMarkup(rows)


async def sections_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Callback для выбора раздела РЛЭ."""
    query = update.callback_query
    await query.answer()

    data = query.data  # format: "section:{aircraft_id}:{section_id}" or "back" or "back_to_aircrafts"

    if data == "back":
        keyboard = await build_aircraft_keyboard()
        await query.edit_message_text("Выберите самолёт:", reply_markup=keyboard)
        return

    if data == "back_to_aircrafts":
        aircrafts = list_aircrafts()
        rows = []
        for ac in aircrafts:
            btn = InlineKeyboardButton(
                f"{ac['image_emoji']} {ac['name']}",
                callback_data=f"aircraft:{ac['id']}",
            )
            rows.append([btn])
        keyboard = InlineKeyboardMarkup(rows)
        await query.edit_message_text("Выберите самолёт:", reply_markup=keyboard)
        return

    if data.startswith("section:"):
        parts = data.split(":")
        aircraft_id = parts[1]
        section_id = parts[2]
        section = get_aircraft_section(aircraft_id, section_id)

        if not section:
            await query.edit_message_text("Раздел не найден.")
            return

        # Формируем текст раздела
        text = f"📖 {section['title']}\n\n"

        for key, value in section["content"].items():
            label = key.replace("_", " ").title()
            text += f"**{label}:** {value}\n"

        if section.get("details"):
            text += "\n---\n"
            for detail in section["details"]:
                text += f"• {detail}\n"

        keyboard = await build_sections_keyboard(aircraft_id, "")
        await query.edit_message_text(text, parse_mode="Markdown", reply_markup=keyboard)
        return


async def aircraft_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Callback для выбора самолёта."""
    query = update.callback_query
    await query.answer()

    data = query.data  # format: "aircraft:{id}"
    parts = data.split(":")
    aircraft_id = parts[1]

    from data import get_aircraft_by_id
    ac = get_aircraft_by_id(aircraft_id)
    if not ac:
        await query.edit_message_text("Самолёт не найден.")
        return

    text = f"{ac['image_emoji']} **{ac['name']}**\n"
    text += f"*{ac['designation']}*\n\n"
    text += ac["description"] + "\n\n"
    text += f"Разделов РЛЭ: {len(ac['sections'])}\n"

    keyboard = await build_sections_keyboard(aircraft_id, ac["name"])
    await query.edit_message_text(text, parse_mode="Markdown", reply_markup=keyboard)


# ==================== Main ====================

def main():
    if BOT_TOKEN == "YOUR_BOT_TOKEN_HERE":
        logger.warning("Установите переменную окружения BOT_TOKEN")
        return

    app = Application.builder().token(BOT_TOKEN).build()

    # Команды
    app.add_handler(CommandHandler("start", start_handler))
    app.add_handler(CommandHandler("aircrafts", api_aircrafts_handler))
    app.add_handler(CommandHandler("sections", api_sections_handler))
    app.add_handler(CommandHandler("section", api_section_handler))

    # Inline callbacks (fallback без Web App)
    app.add_handler(CallbackQueryHandler(aircraft_callback, pattern=r"^aircraft:"))
    app.add_handler(CallbackQueryHandler(sections_callback, pattern=r"^(section:|back_to_aircrafts)$"))

    logger.info("Бот запущен...")
    app.run_polling()


if __name__ == "__main__":
    main()

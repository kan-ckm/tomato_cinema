import { CONFIG } from "@/config";
import { Telegraf } from "telegraf";
import { registerBothandlers } from "./handlers";

export function createBot() {
    const bot = new Telegraf(CONFIG.BOT_TOKEN!)

    registerBothandlers(bot)
    return bot
}
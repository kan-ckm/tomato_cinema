import { Telegraf } from "telegraf";
import { registerStartHandler } from "./start.handlers";

export function registerBothandlers(bot: Telegraf) {
    registerStartHandler(bot)
}
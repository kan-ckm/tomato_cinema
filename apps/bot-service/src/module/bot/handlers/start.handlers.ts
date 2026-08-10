import { Telegraf } from "telegraf";

export function registerStartHandler(bot: Telegraf) {
    bot.start(async ctx => {
        await ctx.reply('hello')
    })
}
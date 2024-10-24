/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { Bot, Context, webhookCallback } from 'grammy';

interface Env {
	BOT_TOKEN: string;
	CHANNELID: string;
}

interface Ruozi {
	code: string;
	ruozi: string;
}
async function fetchAndSendMessages(ctx: Context, bot: Bot, env: Env) {
	for (let i = 0; i < 3; i++) {
		const response = await fetch('https://www.7ed.net/ruozi/api');
		const data: Ruozi = await response.json();
		if (data.code) {
			await ctx.reply(data.ruozi);
			await bot.api.sendMessage(env.CHANNELID, data.ruozi);
		}
	}
}
export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const bot = new Bot(env.BOT_TOKEN);

		bot.command('start', (ctx: Context) => ctx.reply('Hello!'));

		bot.command('ruozhiba', async (ctx: Context) => {
			await fetchAndSendMessages(ctx, bot, env);
		});

		bot.command('tongbu', async (ctx: Context) => {
			await ctx.reply('同步成功');
		});

		return webhookCallback(bot, 'cloudflare-mod')(request);
	},
	async scheduled(event: ScheduledEvent, env: Env) {
		const bot = new Bot(env.BOT_TOKEN);
		bot.command('ruozhiba', async (ctx: Context) => {
			await fetchAndSendMessages(ctx, bot, env);
		});
		return webhookCallback(bot, 'cloudflare-mod');
	},
};

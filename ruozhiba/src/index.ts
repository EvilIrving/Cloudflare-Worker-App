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
	ruozi_db: D1Database;
}

// 随机查询未使用的图片 并更新状态为已使用
async function getRandomUnusedAndMark(db: D1Database, number = 3): Promise<Record<string, unknown>[]> {
	// 修改返回类型为 Promise
	const { results } = await db
		.prepare(
			`
		SELECT id, author, content, abs
		FROM ruozhi
		WHERE isUsed = false
		ORDER BY RANDOM()
		LIMIT ?
	`
		)
		.bind(number)
		.all();

	if (results.length > 0) {
		const updateStmt = db.prepare(`
			UPDATE ruozhi
			SET isUsed = true
			WHERE id = ?
		`);

		const batch = results.map((item) => updateStmt.bind(item.id));
		await db.batch(batch);
	}

	return results;
}

async function fetchAndSendMessages(bot: Bot, env: Env, ctx?: Context) {
	const data: Record<string, unknown>[] = await getRandomUnusedAndMark(env.ruozi_db, 5);

	if (data.length > 0) {

		for (const item of data) {
			let msg = ''
			if(item.abs ){
				msg = `${item.content}
abs: ${item.abs}
--- ${item.author}`
			} else {
				msg = `${item.content}`;
			}
			if (ctx) {
				await ctx.reply(msg);
			}
			await bot.api.sendMessage(env.CHANNELID, msg);
		}
	} else {
		if (ctx) {
			await ctx.reply('没有更多了');
		}
		await bot.api.sendMessage(env.CHANNELID, '没有更多了');
	}
}
export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const bot = new Bot(env.BOT_TOKEN);

		bot.command('start', (ctx: Context) => ctx.reply('Hello!'));

		bot.command('ruozhiba', async (ctx: Context) => {
			await fetchAndSendMessages(bot, env, ctx);
		});

		bot.command('tongbu', async (ctx: Context) => {
			await ctx.reply('同步成功');
		});

		return webhookCallback(bot, 'cloudflare-mod')(request);
	},
	async scheduled(event: ScheduledEvent, env: Env) {
		const bot = new Bot(env.BOT_TOKEN);
		await fetchAndSendMessages(bot, env);
		return webhookCallback(bot, 'cloudflare-mod');
	},
};

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

interface RuoziData {
	author: string;
	content: string;
	l_num: number;
	ctime: string;
}
// 随机查询未使用的图片 并更新状态为已使用
async function getRandomUnusedAndMark(db: D1Database, number = 3): Promise<Record<string, unknown>[]> {
	// 修改返回类型为 Promise
	const { results } = await db
		.prepare(
			`
		SELECT id, author, content, l_num, ctime
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

		const batch = results.map((photo) => updateStmt.bind(photo.id));
		await db.batch(batch);
	}

	return results;
}

async function fetchAndSendMessages(ctx: Context, bot: Bot, env: Env) {
	for (let i = 0; i < 3; i++) {
		const data: Record<string, unknown>[] = await getRandomUnusedAndMark(env.ruozi_db);

		if (data.length > 0) {
			data.forEach(async (item) => {
				// 确保 item.content 是字符串类型
				await ctx.reply(`「${item.content}」—— ${item.author}`);
				await bot.api.sendMessage(env.CHANNELID, `「${item.content}」—— ${item.author}`);
			});
		} else {
			await ctx.reply('没有更多了');
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

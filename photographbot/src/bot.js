import { Bot } from 'grammy';
export let bot = null;
export function initBot(env) {
	if (bot) {
		return bot;
	}
	bot = new Bot(env.TG_TOKEN, { botInfo: JSON.parse(env.BOT_INFO) });
	return bot;
}


// let bot;

// export function setBot(bot) {
// 	bot = bot;
// }

// export function getBot() {
// 	if (!bot) {
// 		throw new Error('Bot not set');
// 	}
// 	return bot;
// }

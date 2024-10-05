import { webhookCallback, InputFile } from 'grammy';
import { initR2 } from './r2';
import { initBot } from './bot';
import { setPhotosManager } from './photos-manager';
export default {
	async fetch(request, env, ctx) {
		// 初始化 bot
		const bot = initBot(env);
		// 初始化图片管理器
		const photosManager = setPhotosManager(env);
		// 初始化 R2
		const r2 = initR2(env.graph_bk);

		// 处理命令
		bot.command('start', async (ctx) => {
			await ctx.reply('Hello, world!');

			// setCommands
			// delete
			// sendpic
			//

			// bot.setMyCommands([ ]);
		});

		// 无关消息处理
		// bot.on('message', async (ctx) => {
		// 	await ctx.reply('I received your message!');
		// });

		bot.command('delete', async (ctx) => {
			const id = ctx.message.text.split(' ')[1];
			await photosManager.deleteById(Number(id));
			await ctx.reply('Deleted');
		});

		bot.command('sendpic', async (ctx) => {
			// 发送随机三张图片给 channel 或 bot
			const photos = await photosManager.getThreeRandomUnusedAndMark();

			if (photos && photos.length === 0) {
				await ctx.reply('No unused photos');
			}
			//  发送图片给 channel 或 bot
			for (const photo of photos) {
				await ctx.replyWithPhoto(photo.url);
				await bot.api.sendPhoto(env.CHNENELID, new InputFile({ url: photo.url }));
			}
		});

		//  重置数据库 D1
		// bot.command('resetdb', async (ctx) => {
		// 	if (ctx.message.from.id === env.ADMINID) {
		// 		await photosManager.resetDB();
		// 		await ctx.reply('Resetted');
		// 	} else {
		// 		await ctx.reply('Sorry, No permission');
		// 	}
		// });

		bot.on('message:photo', async (ctx) => {
			console.log('photo');
			const message = ctx.message;
			const file_id = message.photo[message.photo.length - 1].file_id;
			const file = await ctx.api.getFile(file_id);
			const file_path = `https://api.telegram.org/file/bot${env.TG_TOKEN}/${file.file_path}`; // 文件在 Bot API 服务器内的路径, 一小时有效

			/** 保存图片到 Cloudflare R2 */
			// 文件名 时间戳 加 后缀名
			const file_name = `${Date.now()}.${file_path.split('.').pop()}`;

			// 获取图片
			const file_data = await fetch(file_path).then((res) => res.arrayBuffer());
			// 上传图片到 Cloudflare R2
			const file_url_r2 = await r2.put(file_name, file_data);

			// 新增图片数据, 插入数据库 D1
			await photosManager.insertSingle(file_name, file_url_r2);

			await ctx.reply('Saved in R2 and D1');
		});

		return webhookCallback(bot, 'cloudflare-mod', {
			onTimeout: (ctx) => {
				console.log('Timeout:', ctx.update.update_id);
			},
			timeoutMilliseconds: 100_000,
		})(request);
	},

	async scheduled(controller, env, ctx) {
		// 初始化 bot
		const bot = initBot(env);
		// 初始化图片管理器
		const photosManager = setPhotosManager(env);

		// 发送随机三张图片给 channel 或 bot
		const photos = await photosManager.getThreeRandomUnusedAndMark();

		if (photos.length === 0) {
			await bot.api.sendMessage(env.CHNENELID, 'No unused photos');
		}
		//  发送图片给 channel 或 bot
		for (const photo of photos) {
			await bot.api.sendPhoto(env.CHNENELID, new InputFile({ url: photo.url }));
		}
		return webhookCallback(bot, 'cloudflare-mod');
	},
};

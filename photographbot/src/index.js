import { webhookCallback } from 'grammy';
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
			// bot.setMyCommands([
			// 	{ command: 'delete', description: 'Delete a photo by id' },
			// 	{ command: 'sendpic', description: 'Send three random unused photos' },
			// 	{ command: 'list', description: 'List all photos' },
			// 	{ command: 'reset', description: 'Reset R2 and D1' },
			// 	{ command: 'insertfromr2', description: 'Insert all photos from R2 to D1' },
			// ]);
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

			if (photos.length === 0) {
				await ctx.reply('No unused photos');
			}
			//  发送图片给 channel 或 bot
			for (const photo of photos) {
				await ctx.replyWithPhoto(photo.url);
				// await bot.api.sendPhoto({ chat_id: ctx.chat.id, photo: photo.url });
			}
		});
		bot.command('list', async (ctx) => {
			await ctx.reply('Listed');
		});
		bot.command('reset', async (ctx) => {
			// 重置 R2 图片库,删除所有图片数据, 重置数据库 D1
			await photosManager.deleteAllFromR2();
			await ctx.reply('Resetted');
		});

		bot.command('insertfromr2', async (ctx) => {
			// 从 R2 图片库导入图片数据, 并插入数据库 D1
			await photosManager.insertAllFromBucket();
			await ctx.reply('Inserted');
		});

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
			timeoutMilliseconds: 1000_000,
		})(request);
	},

	async schedule
};

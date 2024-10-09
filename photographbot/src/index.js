import { webhookCallback, InputFile } from 'grammy';
import { initR2 } from './r2';
import { initBot } from './bot';
import { setPhotosManager } from './photos-manager';

const handleSendPhotos = async (ctx, bot, photosManager, env, count) => {
	const photos = await photosManager.getRandomUnusedAndMark(count);
	if (photos.length === 0) {
		await bot.api.sendMessage(env.CHNENELID, 'No unused photos');
		return;
	}

	// 5张图片为一组
	for (let i = 0; i < photos.length; i += 5) {
		const group = photos.slice(i, i + 5);
		await ctx.replyWithMediaGroup(group.map((photo) => ({ type: 'photo', media: new InputFile({ url: photo.url }) })));
		await bot.api.sendMediaGroup(
			env.CHNENELID,
			group.map((photo) => ({ type: 'photo', media: new InputFile({ url: photo.url }) }))
		);
	}
};

const handlePhotoUpload = async (ctx, r2, photosManager, env) => {
	const message = ctx.message;
	const file_id = message.photo[message.photo.length - 1].file_id;
	const file = await ctx.api.getFile(file_id);
	const file_path = `https://api.telegram.org/file/bot${env.TG_TOKEN}/${file.file_path}`;

	const file_name = `${Date.now()}.${file_path.split('.').pop()}`;
	const file_data = await fetch(file_path).then((res) => res.arrayBuffer());
	const file_url_r2 = await r2.put(file_name, file_data);

	await photosManager.insertSingle(file_name, file_url_r2);
	await ctx.reply('Saved in R2 and D1');
};

export default {
	async fetch(request, env, ctx) {
		const bot = initBot(env);
		const photosManager = setPhotosManager(env);
		const r2 = initR2(env.graph_bk);

		bot.command('start', async (ctx) => {
			await ctx.reply('Hello, world!');
		});

		bot.command('send3pic', (ctx) => handleSendPhotos(ctx, bot, photosManager, env, 3));
		bot.command('send10pic', (ctx) => handleSendPhotos(ctx, bot, photosManager, env, 10));
		bot.command('send20pic', (ctx) => handleSendPhotos(ctx, bot, photosManager, env, 20));

		bot.on('message:photo', (ctx) => handlePhotoUpload(ctx, r2, photosManager, env));

		return webhookCallback(bot, 'cloudflare-mod', {
			onTimeout: () => console.log('Timeout'),
			timeoutMilliseconds: 20_000,
		})(request);
	},

	async scheduled(controller, env, ctx) {
		const bot = initBot(env);
		const photosManager = setPhotosManager(env);

		const photos = await photosManager.getRandomUnusedAndMark(5);

		if (photos.length === 0) {
			await bot.api.sendMessage(env.CHNENELID, 'No unused photos');
		} else {
			for (let index = 0; index < photos.length; index += 5) {
				const group = photos.slice(index, index + 5);
				await bot.api.sendMediaGroup(
					env.CHNENELID,
					group.map((photo) => ({ type: 'photo', media: new InputFile({ url: photo.url }) }))
				);
			}
		}

		return webhookCallback(bot, 'cloudflare-mod');
	},
};

// photosManager.js

class PhotosManager {
	constructor(env) {
		this.env = env;
	}

	// 从 R2 bucket 插入所有图片数据
	async insertAllFromBucket() {
		const objects = await this.env.graph_bk.list();
		const stmt = this.env.photo_db.prepare(`
      INSERT INTO photos (name, url, isUsed)
      VALUES (?, ?, false)
    `);

		for (const object of objects.objects) {
			console.log(`Inserting ${object.url}...`);
			// console.log(object,object.size / 1024);
			await stmt.bind(object.key, `https://pub-9350f14105fb48d49bb0de3e2822bc9e.r2.dev/${object.key}`).run();
		}
	}

	// 插入单个图片数据
	async insertSingle(name, url) {
		await this.env.photo_db
			.prepare(
				`
      INSERT INTO photos (name, url, isUsed)
      VALUES (?, ?, false)
    `
			)
			.bind(name, url)
			.run();
	}

	// 随机查询 3 张未使用的图片 并更新状态为已使用
	async getThreeRandomUnusedAndMark() {
		// 首先查询3张未使用的图片
		const { results } = await this.env.photo_db
			.prepare(`
				SELECT id, name, url, created_at
				FROM photos
				WHERE isUsed = false
				ORDER BY RANDOM()
				LIMIT 3
			`)
			.all();

		if (results.length > 0) {
			// 准备更新语句
			const updateStmt = this.env.photo_db.prepare(`
				UPDATE photos
				SET isUsed = true
				WHERE id = ?
			`);

			// 创建一个批处理操作
			const batch = results.map(photo => updateStmt.bind(photo.id));

			// 执行批处理
			await this.env.photo_db.batch(batch);
		}

		return results;
	}
	// 删除 R2 所有图片
	async deleteAllFromR2() {
		const objects = await this.env.graph_bk.list();
		for (const object of objects.objects) {
			await this.env.graph_bk.delete(object.key);
		}
		// 清空数据库
		await this.env.photo_db.prepare('DELETE FROM photos').run();
	}

	// 根据 Id 删除某一张图片
	async deleteById(id) {
		const photo = await this.env.photo_db.prepare('SELECT * FROM photos WHERE id = ?').bind(id).first();
		if (photo) {
			// 从 R2 删除
			await this.env.BUCKET.delete(photo.name);
			// 从数据库删除
			await this.env.photo_db.prepare('DELETE FROM photos WHERE id = ?').bind(id).run();
		}
	}
}

export let photosManager = null;

export function setPhotosManager(env) {
	if (photosManager) {
		return photosManager;
	}
	photosManager = new PhotosManager(env);
	return photosManager;
}

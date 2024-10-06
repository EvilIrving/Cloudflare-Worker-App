// photosManager.js

class PhotosManager {
	constructor(env) {
		this.env = env;
	}

	// 插入单个图片数据
	async insertSingle(name, url) {
		await this.env.graph_db
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
	async getRandomUnusedAndMark(number = 3) {
		// TODO 这里应该先检查是否有 photos 表 , 如果没有这张表 则创建

		// 首先查询3张未使用的图片
		const { results } = await this.env.graph_db
			.prepare(
				`
				SELECT id, name, url, created_at
				FROM photos
				WHERE isUsed = false
				ORDER BY RANDOM()
				LIMIT ${number}
			`
			)
			.all();

		if (results.length > 0) {
			// 准备更新语句
			const updateStmt = this.env.graph_db.prepare(`
				UPDATE photos
				SET isUsed = true
				WHERE id = ?
			`);

			// 创建一个批处理操作
			const batch = results.map((photo) => updateStmt.bind(photo.id));

			// 执行批处理
			await this.env.graph_db.batch(batch);
		}

		return results;
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

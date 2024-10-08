// photosManager.js

class PhotosManager {
	constructor(env) {
		this.env = env;
		this.db = env.graph_db;
	}

	// 插入单个图片数据
	async insertSingle(name, url) {
		const stmt = this.db.prepare(`
			INSERT INTO photos (name, url, isUsed)
			VALUES (?, ?, false)
		`);
		await stmt.bind(name, url).run();
	}

	// 随机查询未使用的图片 并更新状态为已使用
	async getRandomUnusedAndMark(number = 3) {
		// await this.initializeTable();

		const { results } = await this.db.prepare(`
			SELECT id, name, url, created_at
			FROM photos
			WHERE isUsed = false
			ORDER BY RANDOM()
			LIMIT ?
		`).bind(number).all();

		if (results.length > 0) {
			const updateStmt = this.db.prepare(`
				UPDATE photos
				SET isUsed = true
				WHERE id = ?
			`);

			const batch = results.map(photo => updateStmt.bind(photo.id));
			await this.db.batch(batch);
		}

		return results;
	}

	async initializeTable() {
		await this.db.exec(`
			CREATE TABLE IF NOT EXISTS photos (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL,
				url TEXT NOT NULL,
				isUsed BOOLEAN DEFAULT FALSE,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)
		`);
	}
}

let photosManager = null;

export function setPhotosManager(env) {
	if (!photosManager) {
		photosManager = new PhotosManager(env);
	}
	return photosManager;
}

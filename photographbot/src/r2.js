import { r2_path } from './constant';
// CloudflareR2 class definition
class CloudflareR2 {
	constructor(bucket) {
		this.bucket = bucket;
	}

	async put(key, data) {
		await this.bucket.put(key, data);
		// 拼接 Cloudflare R2 链接
		const file_url_r2 = `${r2_path}${key}`;
		return file_url_r2;
	}

	async getUrlByKey(key) {
		const object = await this.bucket.get(key);
		if (object === null) {
			throw new Error(`Object with key ${key} not found`);
		}
		const url = await this.bucket.createSignedUrl({
			bucket: this.bucket,
			key: key,
			expiresIn: 3600, // URL expires in 1 hour
		});
		return url;
	}

	async deleteByKey(key) {
		await this.bucket.delete(key);
		return true;
	}

	async resetR2() {
		let cursor;
		do {
			const listed = await this.bucket.list({ cursor });
			for (const object of listed.objects) {
				await this.bucket.delete(object.key);
			}
			cursor = listed.cursor;
		} while (cursor);
		return true;
	}
}

export let r2 = null;

export function initR2(bucket) {
	if (r2) {
		return r2;
	}
	r2 = new CloudflareR2(bucket);
	return r2;
}

# photograph bot

## 优化功能

[ ]  报错优化
[*]  统一变量 bucket d1 名称
[ ]  优化命令使用
[ ]  优化返回信息
[ ]  优化代码结构
[ ]  创建一个 grammy bot template
[ ]  发送消息携带 摄影师信息
[ ]  接收视频 和 组图
 
## Cloudflare Worker 部署

设置加密变量

```plain
 pnpx wrangler secret put TG_TOKEN
```

## Cloudflare R2

## 校验

1. 自定义标头 X-Custom-Auth
2. Authentication 验证身份

### 使用绑定

bucket.put(data,key)
bucket.get(key) 获取 key 对应的文件内容,包括 url size name type
bucket.delete(key) key 是 文件名是可选值, 若不传则删除整个 bucket的内容
bucker.list() 列出 bucket 里面的所有文件名

### 使用 API

需要在 Cloudflare Workers 的环境变量中设置 CLOUDFLARE_ACCOUNT_ID、CLOUDFLARE_API_TOKEN 和 R2_BUCKET_NAME, 使用示例:

```javascript
class CloudflareR2 {
  constructor(env) {
    this.CLOUDFLARE_ACCOUNT_ID = env.CLOUDFLARE_ACCOUNT_ID;
    this.CLOUDFLARE_API_TOKEN = env.CLOUDFLARE_API_TOKEN;
    this.R2_BUCKET_NAME = env.R2_BUCKET_NAME;
  }

  async put(imageData, filename) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.CLOUDFLARE_ACCOUNT_ID}/r2/buckets/${this.R2_BUCKET_NAME}/objects/${filename}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/octet-stream',
      },
      body: imageData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    return filename;
  }

  async getUrlByKey(key) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.CLOUDFLARE_ACCOUNT_ID}/r2/buckets/${this.R2_BUCKET_NAME}/objects/${key}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.CLOUDFLARE_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get file URL: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result.presigned_url;
  }

  async deleteByKey(key) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.CLOUDFLARE_ACCOUNT_ID}/r2/buckets/${this.R2_BUCKET_NAME}/objects/${key}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.CLOUDFLARE_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.statusText}`);
    }

    return true;
  }

  async resetR2() {
    const listUrl = `https://api.cloudflare.com/client/v4/accounts/${this.CLOUDFLARE_ACCOUNT_ID}/r2/buckets/${this.R2_BUCKET_NAME}/objects`;

    const listResponse = await fetch(listUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.CLOUDFLARE_API_TOKEN}`,
      },
    });

    if (!listResponse.ok) {
      throw new Error(`Failed to list objects: ${listResponse.statusText}`);
    }

    const objects = await listResponse.json();

    for (const object of objects.result) {
      await this.deleteByKey(object.key);
    }

    return true;
  }
}
```

## Cloudflare D1

### Commnad Line 本地创建表

wrangler d1 execute bindingname --file=./schema.sql

```sql
wrangler d1 execute graph_db --file=./schema.sql   
```

## 本地调试

关键词: **内网穿透**

使用 Cloudflare 新建 Tunnel，将本地端口映射到 Cloudflare 上的端口，即可进行本地调试。

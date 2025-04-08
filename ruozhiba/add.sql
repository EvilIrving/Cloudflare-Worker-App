-- 向 ruozhi 表添加 abs 字段
-- ALTER TABLE ruozhi ADD COLUMN abs TEXT NOT NULL DEFAULT '';

-- 1. 重命名现有表
ALTER TABLE ruozhi RENAME TO ruozhi_old;

-- 2. 创建新表，包含所需的默认值
CREATE TABLE ruozhi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author TEXT NOT NULL DEFAULT "",
    content TEXT NOT NULL DEFAULT "",
    abs TEXT NOT NULL DEFAULT "",
    l_num INTEGER NOT NULL DEFAULT 1,
    ctime TEXT NOT NULL DEFAULT "",
    isUsed BOOLEAN NOT NULL DEFAULT false
);

-- 3. 将数据从旧表复制到新表
INSERT INTO ruozhi (id, author, content, abs, l_num, ctime, isUsed)
SELECT id, author, content, abs, COALESCE(l_num, 1), ctime, isUsed
FROM ruozhi_old;

-- 4. 删除旧表
DROP TABLE ruozhi_old;

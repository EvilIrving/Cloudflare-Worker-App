const fs = require('fs');

// 读取 JSON 文件
const data = JSON.parse(fs.readFileSync('./annual.json', 'utf8'));

// 生成创建表的 SQL
const createTableSQL = `
DROP TABLE IF EXISTS ruozhi;
CREATE TABLE ruozhi (
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    l_num INTEGER NOT NULL,
    ctime TEXT NOT NULL
);
`;

// 将数据分批处理,每批 80 条
const batchSize = 80;
let sqlStatements = [createTableSQL];
let currentBatch = [];

data.forEach((item, index) => {
    currentBatch.push(`(
        '${item.author.replace(/'/g, "''")}',
        '${item.content.replace(/'/g, "''")}',
        ${item.l_num},
        '${item.ctime}'
    )`);

    // 当达到批量大小或是最后一条数据时,生成 INSERT 语句
    if (currentBatch.length === batchSize || index === data.length - 1) {
        const insertSQL = `INSERT INTO ruozhi (author, content, l_num, ctime) VALUES ${currentBatch.join(',')};`;
        sqlStatements.push(insertSQL);
        currentBatch = [];
    }
});

// 写入到 SQL 文件
fs.writeFileSync(
    'ruozhi.sql',
    sqlStatements.join('\n')
);

console.log(`Successfully generated SQL file with ${data.length} records`);

const fs = require('fs');

// 读取 JSON 文件
const data = JSON.parse(fs.readFileSync('./title-good.json', 'utf8'));

// 将数据分批处理,每批 80 条
const batchSize = 100;
let sqlStatements = [];
let currentBatch = [];

data.forEach((item, index) => {
	let sentence;
	if (item.title == item.abs) {
		sentence = `(
			'${item.lz}',
			'${item.title}',
			''
		)`;
	} else {
		sentence = `(
			'${item.lz}',
			'${item.title}',
			'${item.abs || ""}'
		)`;
	}

	currentBatch.push(sentence);

	// 当达到批量大小或是最后一条数据时,生成 INSERT 语句
	if (currentBatch.length === batchSize || index === data.length - 1) {
		const insertSQL = `INSERT INTO ruozhi (author, content, abs) VALUES ${currentBatch.join(',')};`;
		sqlStatements.push(insertSQL);
		currentBatch = [];
	}
});

// 写入到 SQL 文件
fs.writeFileSync('good.sql', sqlStatements.join('\n\n'));

console.log(`Successfully generated SQL file with ${data.length} records`);

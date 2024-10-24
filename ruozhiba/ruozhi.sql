-- Drop table if exists to avoid conflicts
DROP TABLE IF EXISTS sentences;

-- Create new table with specified fields
CREATE TABLE sentences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    l_num INTEGER NOT NULL,
    ctime TEXT NOT NULL
);

-- Add some index for better performance
CREATE INDEX idx_author ON sentences(author);
CREATE INDEX idx_ctime ON sentences(ctime);

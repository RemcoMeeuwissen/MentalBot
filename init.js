"use strict";

const sqlite3 = require('sqlite3')
const db = new sqlite3.Database('./mentalbot.sqlite')

db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS posts (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, url TEXT NOT NULL)')
})

db.close()

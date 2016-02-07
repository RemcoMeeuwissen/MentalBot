"use strict";

const config = require('./config.json')

const sqlite3 = require('sqlite3')
const db = new sqlite3.Database('./mentalbot.sqlite')
const rawjs = require('raw.js')
const reddit = new rawjs(config['useragent'])

const mentalbot = require('./mentalbot.js')(db, reddit)

mentalbot.createTable().then(() => {
    if (process.argv[2] !== undefined && process.argv[2] === '--add-posts') {
        mentalbot.getRecentPosts().then((body) => {
            return mentalbot.parseRecentPosts(body)
        }).then((data) => {
            let posts = data.map(mentalbot.savePost)
            return Promise.all(posts)
        }).then(() => {
            console.log('four')
            db.close()
        })
    } else {
        db.close()
    }
})

"use strict";

const config = require('./config.json')

const sqlite3 = require('sqlite3')
const db = new sqlite3.Database('./mentalbot.sqlite')
const rawjs = require('raw.js')
const reddit = new rawjs(config['useragent'])

const mentalbot = require('./mentalbot.js')(db, reddit, config)

reddit.setupOAuth2(
    config['clientID'],
    config['secret']
)

reddit.auth({'username': config['username'], 'password': config['password']}, (err, response) => {
    if(err) {
        console.log('Unable to authenticate user: ' + err);
    } else {
        mentalbot.getRecentPosts().then((body) => {
            return mentalbot.parseRecentPosts(body)
        }).then((data) => {
            let posts = data.map(mentalbot.savePost)
            return Promise.all(posts)
        }).then((data) => {
            let newPosts = data.map(mentalbot.postToReddit)
            return Promise.all(newPosts)
        }).then(() => {
            db.close()
            reddit.logout()
        })
    }
})

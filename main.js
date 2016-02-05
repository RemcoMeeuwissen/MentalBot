"use strict";

const config = require('./config.json')

const request = require('request')
const cheerio = require('cheerio')
const sqlite3 = require('sqlite3')
const db = new sqlite3.Database('./mentalbot.sqlite')
const rawjs = require('raw.js')
const reddit = new rawjs(config['useragent'])

reddit.setupOAuth2(
    config['clientID'],
    config['secret']
)

reddit.auth({'username': config['username'], 'password': config['password']}, (err, response) => {
    if(err) {
        console.log('Unable to authenticate user: ' + err);
    } else {
        getRecentPosts().then((body) => {
            return parseRecentPosts(body)
        }).then((data) => {
            let posts = data.map(savePost)
            return Promise.all(posts)
        }).then((data) => {
            let newPosts = data.map(PostToReddit)
            return Promise.all(newPosts)
        }).then(() => {
            db.close()
            reddit.logout()
        })
    }
})

let getRecentPosts = () => {
    return new Promise((resolve, reject) => {
        request('http://mentalpod.com/episodes', (error, response, body) => {
            if (error || response.statusCode !== 200) {
                console.log(error)
            }

            resolve(body)
        })
    })
}

let parseRecentPosts = (body) => {
    return new Promise((resolve, reject) => {
        let $ = cheerio.load(body)
        let posts = []

        $('.widget_recent_entries li').each((i, elem) => {
            let children = $(elem).children()

            for (let i = 0; i < children.length; i++) {
                let child = children[i]

                if (child.tagName === 'a') {
                    posts.push([$(child).text(), $(child).attr('href')])
                }
            }
        })

        resolve(posts)
    })
}

let savePost = (data) => {
    let title = data[0]
    let url = data[1]

    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM posts WHERE url = ?', [url], (err, row) => {
            if (err !== null) {
                console.log(err)
                resolve([])
            } else if (row === undefined) {
                db.run('INSERT INTO posts (title, url) VALUES (?, ?)', [title, url], (error) => {
                    if (error !== null) {
                        console.log(error)
                    }

                    resolve([title, url])
                })
            } else {
                resolve([])
            }
        })
    })
}

let PostToReddit = (data) => {
    if (data.length === 0) {
        return true
    } else {
        let title = data[0]
        let url = data[1]

        return new Promise((resolve, reject) => {
            if (! url.startsWith('http://mentalpod.com/archives/')) {
                reddit.submit({'url': url, 'title': title, 'r': config['subreddit']}, (error, id) => {
                    if (error !== null) {
                        console.log(error)
                    } else {
                        console.log('Added ' + title + ' to Reddit')
                    }

                    resolve()
                })
            } else {
                resolve()
            }
        })
    }
}

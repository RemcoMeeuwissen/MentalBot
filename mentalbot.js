"use strict";

const request = require('request')
const cheerio = require('cheerio')

module.exports = (db, reddit, config) => {
    return {
        'createTable': () => {
            return new Promise((resolve, reject) => {
                db.run('CREATE TABLE IF NOT EXISTS posts (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, url TEXT NOT NULL)', (error) => {
                    if (error) {
                        console.log(error)
                    }

                    resolve()
                })
            })
        },
        'getRecentPosts': () => {
            return new Promise((resolve, reject) => {
                request('http://mentalpod.com/episodes', (error, response, body) => {
                    if (error || response.statusCode !== 200) {
                        console.log(error)
                    }

                    resolve(body)
                })
            })
        },
        'parseRecentPosts': (body) => {
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
        },
        'savePost': (data) => {
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
        },
        'postToReddit': (data) => {
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
    }
}

"use strict";

const request = require('request')
const cheerio = require('cheerio')
const sqlite3 = require('sqlite3')
const db = new sqlite3.Database('./mentalbot.sqlite')

let posts = []

request('http://mentalpod.com/episodes', (error, response, body) => {
  if (! error && response.statusCode == 200) {
    getRecentPosts(body)
  } else {
    console.log(error)
  }
})

let getRecentPosts = (body) => {
    let $ = cheerio.load(body)
    let posts = []

    $('.widget_recent_entries li').each((i, elem) => {
        let children = $(elem).children()

        for (let i = 0; i < children.length; i++) {
            let child = children[i]

            if (child.tagName === 'a') {
                posts.push(savePost($(child).text(), $(child).attr('href')))
            }
        }
    })

    Promise.all(posts).then(() => db.close())
}

let savePost = (title, url) => {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM posts WHERE url = ?', [url], (err, row) => {
            if (err !== null) {
                console.log(err)
                resolve()
            } else if (row === undefined) {
                db.run('INSERT INTO posts (title, url) VALUES (?, ?)', [title, url], (error) => {
                    if (error !== null) {
                        console.log(error)
                    } else {
                        console.log('Post saved: ' + title)
                    }

                    resolve()
                })
            }
        })
    })
}

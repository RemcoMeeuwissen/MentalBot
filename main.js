"use strict";

const request = require('request')
const cheerio = require('cheerio')

request('http://mentalpod.com/episodes', (error, response, body) => {
  if (! error && response.statusCode == 200) {
    getRecentPosts(body)
  } else {
    console.log(error)
  }
})

let getRecentPosts = (body) => {
    let $ = cheerio.load(body)
    let posts = $('.widget_recent_entries')

    console.log(posts.html())
}

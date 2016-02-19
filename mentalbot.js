'use strict';

const request = require('request');
const cheerio = require('cheerio');

module.exports = (db, reddit, config, logger) => ({
  createTable: () => new Promise((resolve) => {
    db.run(`CREATE TABLE IF NOT EXISTS posts (
  id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  url TEXT NOT NULL)`, (error) => {
      if (error) logger.log('error', 'Unable to create the database table: %s', error);
      resolve();
    });
  }),
  getRecentPosts: () => new Promise((resolve) => {
    request('http://mentalpod.com/episodes', (error, response, body) => {
      if (error || response.statusCode !== 200) {
        logger.log('error', 'Unable to retrieve the Mentalpod website: %s', error);
      }
      resolve(body);
    });
  }),
  parseRecentPosts: (body) => new Promise((resolve) => {
    const $ = cheerio.load(body);
    const posts = [];

    $('.widget_recent_entries li').each((i, elem) => {
      const children = $(elem).children();

      for (let x = 0; x < children.length; x++) {
        const child = children[x];
        if (child.tagName === 'a') posts.push([$(child).text(), $(child).attr('href')]);
      }
    });

    resolve(posts);
  }),
  savePost: (data) => {
    const title = data[0];
    const url = data[1];

    return new Promise((resolve) => {
      db.get('SELECT * FROM posts WHERE url = ?', [url], (err, row) => {
        if (err === null && row === undefined) {
          db.run('INSERT INTO posts (title, url) VALUES (?, ?)', [title, url], (error) => {
            if (error !== null) {
              logger.log('error', 'Unable to insert into the database: %s', error);
              resolve([]);
            } else {
              resolve([title, url]);
            }
          });
        } else {
          if (err !== null) logger.log('error', 'Unable to query the database: %s', err);
          resolve([]);
        }
      });
    });
  },
  postToReddit: (data) => {
    if (data.length === 0) return true;

    const title = data[0];
    const url = data[1];

    return new Promise((resolve) => {
      reddit.submit({ url, title, r: config.subreddit }, (error) => {
        if (error !== null) {
          logger.log('error', 'Unable to post to Reddit: %s', error);
        } else {
          logger.log('info', 'Added a episode to Reddit: %s', title);
        }

        resolve();
      });
    });
  },
});

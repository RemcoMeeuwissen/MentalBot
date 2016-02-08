'use strict';

const config = require('./config.json');

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./mentalbot.sqlite');
const Rawjs = require('raw.js');
const reddit = new Rawjs(config.useragent);
const program = require('commander');

const mentalbot = require('./mentalbot.js')(db, reddit, config);

reddit.setupOAuth2(
  config.clientID,
  config.secret
);

program
  .version('1.0.0')
  .option('-r, --ignore-reddit', 'Do not post to Reddit')
  .parse(process.argv);

reddit.auth({ username: config.username, password: config.password }, (error) => {
  if (error) {
    console.log(`Unable to authenticate user: ${ error }`);
  } else {
    mentalbot.createTable().then(
      () => mentalbot.getRecentPosts()
    ).then(
      (body) => mentalbot.parseRecentPosts(body)
    ).then((data) => {
      const posts = data.map(mentalbot.savePost);
      return Promise.all(posts);
    }).then((data) => {
      if (program.ignoreReddit) return true;

      const newPosts = data.map(mentalbot.postToReddit);
      return Promise.all(newPosts);
    }).then(() => {
      db.close();
      reddit.logout();
    });
  }
});

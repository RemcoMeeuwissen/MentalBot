'use strict';

const config = require('./config.json');

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./mentalbot.sqlite');
const Rawjs = require('raw.js');
const reddit = new Rawjs(config.useragent);
const program = require('commander');
const Winston = require('winston');

const logger = new (Winston.Logger)({
  transports: [
    new (Winston.transports.File)({
      filename: 'mentalbot.log',
    }),
  ],
});

const mentalbot = require('./mentalbot.js')(db, reddit, config, logger);

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
    logger.log('error', 'Unable to authenticate user: %s', error);
    db.close();
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

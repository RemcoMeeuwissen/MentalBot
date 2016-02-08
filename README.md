# Mentalbot

This is a simple bot with the aim of getting the latest podcast episodes from the [Mentalpod](http://mentalpod.com/) website and then posting them to Reddit.

## Usage

After installing the dependencies with NPM you can run main.js using nodejs. If you want to populate the database without posting to Reddit you can use "main.js --ignore-reddit". I'm using crontab to run the script at a regular interval.
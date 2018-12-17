'use strict';

const express = require('express');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

//config.js is where we control constanct for entire app:  PORT, DATABASE_URL
const {PORT, DATABASE_URL} = require('./config');
const {Blog} = require('./models');

const app = express();
app.use(express.json());

//GET requests to /posts
app.get("/blog-app", (req, res) => {
    Blog
      .find()
      .then(blogposts => {
          res.json({
              blogposts: blogposts.map(blogpost = blogpost.serialize())
          });
      })
      .catch(err => {
          console.err(err);
          res.status(500).json({message: 'Internal server error'});
      });
});

//open and close server portion
let server;

function runServer(databaseUrl, port=PORT) {
    return new Promise((resolve, reject) => {
        mongoose.connect(
            databaseUrl,
            err => {
                if (err) {
                    return reject(err);
                }
                server = app
                  .listen(port, () => {
                      console.log(`Your app is listening on port ${port}`);
                      resolve();
                  })
                  .on('error', err => {
                      mongoose.disconnect();
                      reject(err)
                  });
            }
        );
    });
}

function closeServer() {
    return mongoose.disconnect().then(() => {
        return new Promise((resolve, reject) => {
            console.log("Closing server");
            server.close(err => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    });
}

//  If server.js is called directly (aka, with `node server.js`), this block
//  runs.  However, we also export the runServer command so other code (for instance, test code) 
//  can start the server as needed.
if (require.main === module) {
    runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = {app, runServer, closeServer};


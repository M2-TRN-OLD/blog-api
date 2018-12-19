'use strict';

const express = require('express');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

//config.js is where we control constanct for entire app:  PORT, DATABASE_URL
const {PORT, DATABASE_URL} = require('./config');
const {Blogposts} = require('./models');

const app = express();
app.use(express.json());

//GET requests to /blogposts
app.get('/blogposts', (req, res) => {
    Blogposts
     .find()
     .populate('author')
     .then(blogposts => {
          res.json({
              blogposts: blogposts.map(blogpost => blogpost.serialize())
          });
      })
      .catch(err => {
          console.err(err);
          res.status(500).json({message: 'Internal server error'});
      });
});

//GET request by ID

app.get("/blogposts/:id", (req, res) => {
    Blogposts
      .findById(req.params.id)
      .then(blogposts => res.json(blogposts.serialize()))
      .catch(err => {
          console.error(err);
          res.status(500).json({message: "Internal server error"});
      });
});

// POST request
app.post('/blogposts',(req,res) => {
    const requiredFields = ['title','author', 'author_id'];
    for (let i=0; i < requiredFields.length; i++) {
        const field = requiredFields[i];
        if (!(field in req.body)) {
            const message = `Missing \`${field}\` in request body`;
            console.error(message);
            return res.status(400).send(message);
        }
    }

    Author
      .findById(req.body.author_id)
      .then(author => {
          if (author) {
            Blogposts
              .create({
                title: req.body.title,
                author: req.body.author,
                content: req.body.content
            })
              .then(blogpost => res.status(201).json(blogpost.serialize()))
              .catch(err => {
                  console.error(err)
                  res.status(500).json({message: 'Internal server error'});
              });
          }
          else {
              const message = 'AUthor not found';
              console.error(message);
              return res.status(400).send(message);
          }
      })
      .catch(err => {
          console.error(err);
          res.status(500).json({error: 'internal server error'});
      });
});


app.put("/blogposts/:id", (req, res) => {
    if(!(req.params.id && req.body.id && req.params.id === req.body.id)) {
        const message = 
          `Request path id (${req.params.id}) and request body id ` +
          `(${req.body.id}) must match`;
        console.error(message);
        return res.status(400).json({message: message});
    }

    const toUpdate = {};
    const updateableFields = ["title", "author", "content"];

    updateableFields.forEach(field => {
        if (field in req.body) {
            toUpdate[field] = req.body[field];
        }
    });
    console.log("toUpdate = ", JSON.stringify(toUpdate));

    Blogposts
      .findByIdAndUpdate(req.params.id, {$set: toUpdate})
      .then(blogposts => res.status(204).end())
      .catch(err => res.status(500).json({message: 'Internal server error'}));//
});


app.delete('/blogposts/:id', (req, res) => {
    Blogposts.findByIdAndRemove(req.params.id)
      .then(blogposts => res.status(204).end())
      .catch(err => res.status(500).json({message: "Internal server error"}));
});


//open and close server portion
let server;

function runServer(databaseUrl, port=PORT) {
    return new Promise((resolve, reject) => {
        //mongoose.set('debug', true);
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


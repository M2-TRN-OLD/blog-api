'use strict';

const mongoose = require('mongoose');

// this is the author schema
const authorSchema = mongoose.Schema({
    firstName: 'string',
    lastName: 'string',
    userName: {
        type: 'string',
        unique: true
    }
});

// this is our schema to represent a blogpost
const blogpostSchema = mongoose.Schema({
    title: String,
    content: String,
    author: {type: mongoose.Schema.Types.ObjectId, ref:'Author'},
    created:{
        type: Date,
        // `Date.now()` returns the current unix timestamp as a number
        default: Date.now
      }

});

blogpostSchema.pre('findOne', function(next) {
    this.populate('author');
    next();
});

blogpostSchema.pre('find', function(next) {
    this.populate('author');
    next();
});

blogpostSchema.virtual("authorName").get(function() {
    return `${this.author.firstName} ${this.author.lastName}`.trim();
});

blogpostSchema.methods.serialize = function() {
    return {
        //id:this._id,
        title: this.title,
        content: this.content,
        author: this.authorName,
        created: this.created
    };
};

const Blogposts = mongoose.model("Blogposts", blogpostSchema);
const Author =  mongoose.model('Author', authorSchema);

module.exports = {Blogposts};
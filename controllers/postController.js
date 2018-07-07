// imports
const mongoose = require('mongoose');
const Post = mongoose.model('Post');
// const User = mongoose.model('User');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

// handle uploads
const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if(isPhoto) {
      next(null, true);
    } else {
      next({ message: 'That filetype isn\'t allowed!' }, false);
    }
  }
};

// home
exports.getPosts = async (req, res) => {
  const page = req.params.page || 1;
  const limit = 4;
  const skip = (page * limit) - limit;

  // 1. Query the database for a list of all posts
  const postsPromise = Post
    .find()
    .skip(skip)
    .limit(limit)
    .sort({ created: 'desc' });

  const countPromise = Post.count();

  const [posts, count] = await Promise.all([postsPromise, countPromise]);
  const pages = Math.ceil(count / limit);
  if (!posts.length && skip) {
    req.flash('info', `Hey! You asked for page ${page}. But that doesn't exist. So I put you on page ${pages}`);
    res.redirect(`/posts/page/${pages}`);
    return;
  };

  res.render('home', { title: 'Home', posts, page, pages, count });
};

exports.addPost = (req, res) => {
  res.render('editPost', { title: 'Add Post'});
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  // check if there is no new file to resize
  if (!req.file) {
    next(); // skip to the next middleware
    return;
  }
  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  // now we resize
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(1000, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  // once we have written the photo to our filesystem, keep going!
  next();
};

exports.createPost = async (req, res) => {
  req.body.author = req.user._id;
  const post = await (new Post(req.body)).save();
  req.flash('success', `Successfully Created ${post.name}. Care to leave a review?`);
  res.redirect(`/post/${post.slug}`);
};

exports.editPost = async (req, res) => {
  // 1. Find the post given the ID
  const post = await Store.findOne({ _id: req.params.id });
  // 2. confirm they are the owner of the post
  confirmOwner(post, req.user);
  // 3. Render out the edit form so the user can update their post
  res.render('editStore', { title: `Edit ${post.name}`, post });
};

exports.updatePost = async (req, res) => {
  // set the location data to be a point
  req.body.location.type = 'Point';
  // find and update the post
  const post = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // return the new post instead of the old one
    runValidators: true
  }).exec();
  req.flash('success', `Successfully updated <strong>${post.name}</strong>. <a href="/posts/${post.slug}">View Store →</a>`);
  res.redirect(`/posts/${post._id}/edit`);
  // Redriect them the post and tell them it worked
};

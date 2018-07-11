// imports
const mongoose = require('mongoose');
const Post = mongoose.model('Post');
const User = mongoose.model('User');
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
  const limit = 12;
  const skip = (page * limit) - limit;

  // 1. Query the database for a list of all posts
  const postsPromise = Post
    .find()
    .skip(skip)
    .limit(limit)
    .sort({ created: 'desc' }
  );

  const countPromise = Post.count();

  const [posts, count] = await Promise.all([postsPromise, countPromise]);
  const pages = Math.ceil(count / limit);
  if (!posts.length && skip) {
    req.flash('info', `Hey! You asked for page ${page}. But that doesn't exist. So I put you on page ${pages}`);
    res.redirect(`/home/page/${pages}`);
    return;
  };

  res.render('home', { title: 'Rentals, Cars, Drivers & Experiences', posts, page, pages, count });
};

// post view
exports.getPostBySlug = async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug }).populate('author reviews');
  if (!post) return next();
  res.render('post', { title: post.name, post });
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
  await photo.resize(1920, 1080);
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

const confirmOwner = (post, user) => {
  if (!post.author.equals(user._id)) {
    throw Error('You must own a post in order to edit it!');
  }
};

exports.editPost = async (req, res) => {
  // 1. Find the post given the ID
  const post = await Post.findOne({ _id: req.params.id });
  // 2. confirm they are the owner of the post
  confirmOwner(post, req.user);
  // 3. Render out the edit form so the user can update their post
  res.render('editPost', { title: `Edit ${post.name}`, post });
};

exports.updatePost = async (req, res) => {
  // set the location data to be a point
  req.body.location.type = 'Point';
  // find and update the post
  const post = await Post.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // return the new post instead of the old one
    runValidators: true
  }).exec();
  req.flash('success', `Successfully updated <strong>${post.name}</strong>. <a href="/posts/${post.slug}">View Post →</a>`);
  res.redirect(`/posts/${post._id}/edit`);
  // Redriect them the post and tell them it worked
};

exports.searchPosts = async (req, res) => {
  const posts = await Post
  // first find posts that match
  .find({
    $text: {
      $search: req.query.q
    }
  }, {
    score: { $meta: 'textScore' }
  })
  // then sort them
  .sort({
    score: { $meta: 'textScore' }
  })
  // limit to only 12 results
  .limit(5);
  res.json(posts);
};

exports.like = async (req, res) => {
  const hearts = req.user.hearts.map(obj => obj.toString());
  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
  const user = await User
    .findByIdAndUpdate(req.user._id,
      { [operator]: { hearts: req.params.id }},
      { new: true }
    );
  res.json(user);
};

exports.getHearts = async (req, res) => {
  const posts = await Post.find({
    _id: { $in: req.user.hearts }
  });
  res.render('home', { title: 'Hearted Posts', posts });
};

exports.getTopPosts = async (req, res) => {
  const posts = await Post.getTopPosts();
  res.render('top', { posts, title:'⭐ Top Riders!'});
};

exports.getPostsByTag = async (req, res) => {
  const tag = req.params.tag;
  const tagQuery = tag || { $exists: true, $ne: [] };
  const tagsPromise = Post.getTagsList();
  const postsPromise = Post.find({ tags: tagQuery });
  const [tags, posts] = await Promise.all([tagsPromise, postsPromise]);

  res.render('tag', { tags, title: 'Tags', tag, posts });
};

exports.mapPage = (req, res) => {
  res.render('map', { title: 'Map' });
};

exports.mapPosts = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const q = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: 10000 // 10km
      }
    }
  };

  const posts = await Post.find(q).select('slug name description location photo').limit(10);
  res.json(posts);
};

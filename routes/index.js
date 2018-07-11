const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const reviewController = require('../controllers/reviewController');
const { catchErrors } = require('../handlers/errorHandlers');

router.get('/', catchErrors(postController.getPosts));
router.get('/home', catchErrors(postController.getPosts));
router.get('/home/page/:page', catchErrors(postController.getPosts));

// add a post routes handler
router.get('/add', authController.isLoggedIn, postController.addPost);

router.post('/add',
  postController.upload,
  catchErrors(postController.resize),
  catchErrors(postController.createPost)
);

router.post('/add/:id',
  postController.upload,
  catchErrors(postController.resize),
  catchErrors(postController.updatePost)
);

router.get('/home/:id/edit', catchErrors(postController.editPost));
router.get('/post/:slug', catchErrors(postController.getPostBySlug));

// login/signup
router.post('/login', authController.login);
router.get('/login', userController.loginForm);
router.get('/signup', userController.signupForm);

// 1. Validate the registration data
// 2. register the user
// 3. we need to log them in
router.post('/signup',
  userController.validateSignup,
  userController.signup,
  authController.login
);

// logout
router.get('/logout', authController.logout);

router.get('/top', catchErrors(postController.getTopPosts));

router.get('/favorites', authController.isLoggedIn, catchErrors(postController.getHearts));

router.get('/tags', catchErrors(postController.getPostsByTag));
router.get('/tags/:tag', catchErrors(postController.getPostsByTag));

router.get('/map', postController.mapPage);

router.get('/account', authController.isLoggedIn, userController.account);
router.post('/account', catchErrors(userController.updateAccount));

// handle recover password
router.get('/forgot', userController.forgotView);
router.post('/account/forgot', catchErrors(authController.forgot));
router.get('/account/reset/:token', catchErrors(authController.reset));
router.post('/account/reset/:token',
  authController.confirmedPasswords,
  catchErrors(authController.update)
);

router.post('/reviews/:id',
  authController.isLoggedIn,
  catchErrors(reviewController.addReview)
);

/*
  API
*/

router.get('/api/search', catchErrors(postController.searchPosts));
router.get('/api/posts/near', catchErrors(postController.mapPosts));
router.post('/api/posts/:id/heart', catchErrors(postController.like));

module.exports = router;

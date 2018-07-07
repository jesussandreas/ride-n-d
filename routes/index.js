const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const { catchErrors } = require('../handlers/errorHandlers');

router.get('/', catchErrors(postController.getPosts));
router.get('/home', catchErrors(postController.getPosts));

// add a post routes handler
router.get('/add', postController.addPost);

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

module.exports = router;

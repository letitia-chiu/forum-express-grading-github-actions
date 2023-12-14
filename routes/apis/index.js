const express = require('express')
const router = express.Router()

// const passport = require('../../config/passport')

const admin = require('./modules/admin')

const restController = require('../../controllers/apis/restaurant-controller')
// const userController = require('../../controllers/apis/user-controller')
// const commentController = require('../../controllers/apis/comment-controllers')

// const upload = require('../../middleware/multer')

// const { authenticated, authenticatedAdmin } = require('../../middleware/auth')

// const { generalErrorHandler } = require('../../middleware/error-handler')

router.use('/admin', admin)

router.get('/restaurants', restController.getRestaurants)

module.exports = router

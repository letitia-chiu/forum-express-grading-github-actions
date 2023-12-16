const bcrypt = require('bcryptjs')

const { User, Comment, Restaurant, Favorite, Like, Followship } = require('../models')
const { localFileHandler } = require('../helpers/file-helpers')

const userServices = {
  signUp: (req, cb) => {
    if (req.body.password !== req.body.passwordCheck) throw new Error('Passwords do not match!')

    User.findOne({ where: { email: req.body.email } })
      .then(user => {
        if (user) throw new Error('Email already exists!')

        return bcrypt.hash(req.body.password, 10)
      })
      .then(hash => User.create({
        name: req.body.name,
        email: req.body.email,
        password: hash
      }))
      .then(newUser => {
        const userData = newUser.toJSON()
        delete userData.password
        return cb(null, { user: userData })
      })
      .catch(err => cb(err))
  },
  getUser: (req, cb) => {
    const userId = req.params.id
    const currentUser = req.user.id

    return Promise.all([
      User.findByPk(userId, { raw: true }),
      Comment.findAndCountAll({
        where: { userId },
        include: { model: Restaurant, attributes: ['id', 'image'] },
        nest: true,
        raw: true
      })
    ])
      .then(([user, comments]) => {
        if (!user) throw new Error("User didn't exist!")

        return cb(null, { profile: user, comments, currentUser })
      })
      .catch(err => cb(err))
  },
  putUser: (req, cb) => {
    // 驗證是否為登入之 user
    if (Number(req.params.id) !== req.user.id) throw new Error('Permission denied!')

    const { name } = req.body
    if (!name) throw new Error('User name is required!')

    const { file } = req

    return Promise.all([
      User.findByPk(req.params.id),
      localFileHandler(file)
    ])
      .then(([user, filePath]) => {
        if (!user) throw new Error("User didn't exist!")

        return user.update({
          name,
          image: filePath || user.image
        })
      })
      .then(updatedUser => {
        const userData = updatedUser.toJSON()
        delete userData.password
        return cb(null, { user: userData })
      })
      .catch(err => cb(err))
  },
  addFavorite: (req, cb) => {
    const userId = req.user.id
    const { restaurantId } = req.params

    return Promise.all([
      Restaurant.findByPk(restaurantId),
      Favorite.findOne({ where: { userId, restaurantId } })
    ])
      .then(([restaurant, favorite]) => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        if (favorite) throw new Error('已經加過最愛')

        return Favorite.create({ userId, restaurantId })
      })
      .then(favorite => {
        return cb(null, favorite)
      })
      .catch(err => cb(err))
  },
  removeFavorite: (req, cb) => {
    return Favorite.findOne({
      where: {
        userId: req.user.id,
        restaurantId: req.params.restaurantId
      }
    })
      .then(favorite => {
        if (!favorite) throw new Error('此餐廳未加入過最愛')

        return favorite.destroy()
      })
      .then(removedFavorite => {
        return cb(null, { favorite: removedFavorite })
      })
      .catch(err => cb(err))
  },
  addLike: (req, cb) => {
    const userId = req.user.id
    const { restaurantId } = req.params

    return Promise.all([
      Restaurant.findByPk(restaurantId),
      Like.findOne({ where: { userId, restaurantId } })
    ])
      .then(([restaurant, like]) => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        if (like) throw new Error("You've liked this restaurant")

        return Like.create({ userId, restaurantId })
      })
      .then(like => {
        return cb(null, like)
      })
      .catch(err => cb(err))
  },
  removeLike: (req, cb) => {
    return Like.findOne({
      where: {
        userId: req.user.id,
        restaurantId: req.params.restaurantId
      }
    })
      .then(like => {
        if (!like) throw new Error("This restaurant hasn't been liked")

        return like.destroy()
      })
      .then(removedLike => {
        return cb(null, { like: removedLike })
      })
      .catch(err => cb(err))
  },
  getTopUsers: (req, cb) => {
    return User.findAll({
      include: [{ model: User, as: 'Followers' }]
    })
      .then(users => {
        const result = users.map(user => ({
          ...user.toJSON(),
          followerCount: user.Followers.length,
          isFollowed: req.user.Followings.some(f => f.id === user.id)
        }))
          .sort((a, b) => b.followerCount - a.followerCount)

        return cb(null, { users: result, currentUserId: req.user.id })
      })
      .catch(err => cb(err))
  },
  addFollowing: (req, cb) => {
    const { userId } = req.params

    // 自行追加：驗證追蹤對象是否為登入之使用者（不能自己追蹤自己）
    if (Number(userId) === req.user.id) throw new Error("You can't follow yourself")

    return Promise.all([
      User.findByPk(userId),
      Followship.findOne({
        where: {
          followerId: req.user.id,
          followingId: userId
        }
      })
    ])
      .then(([user, followship]) => {
        if (!user) throw new Error("User didn't exist!")
        if (followship) throw new Error("You've already followed this user!")

        return Followship.create({
          followerId: req.user.id,
          followingId: userId
        })
      })
      .then(newFollowship => {
        return cb(null, { followship: newFollowship })
      })
      .catch(err => cb(err))
  },
  removeFollow: (req, cb) => {
    return Followship.findOne({
      where: {
        followerId: req.user.id,
        followingId: req.params.userId
      }
    })
      .then(followship => {
        if (!followship) throw new Error("You haven't followed this user!")

        return followship.destroy()
      })
      .then(removedFollowship => {
        return cb(null, { followship: removedFollowship })
      })
      .catch(err => cb(err))
  }
}

module.exports = userServices

const bcrypt = require('bcryptjs')
const { User, Comment, Restaurant, Favorite, Like, Followship } = require('../models')
const { localFileHandler } = require('../helpers/file-helpers')

const userController = {
  signUpPage: (req, res) => {
    return res.render('signup')
  },
  signUp: (req, res, next) => {
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
      .then(() => {
        req.flash('success_messages', '成功註冊帳號！')
        res.redirect('/singin')
      })
      .catch(err => next(err))
  },
  signInPage: (req, res) => {
    res.render('signin')
  },
  signIn: (req, res) => {
    req.flash('success_messages', '成功登入！')
    res.redirect('/restaurants')
  },
  logout: (req, res) => {
    req.flash('success_messages', '登出成功！')
    req.logout()
    res.redirect('/signin')
  },
  getUser: (req, res, next) => {
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

        return res.render('users/profile', { user, comments, currentUser })
      })
      .catch(err => next(err))
  },
  editUser: (req, res, next) => {
    // 驗證是否為登入之 user
    if (Number(req.params.id) !== req.user.id) throw new Error('無權限查看此頁面！')

    return User.findByPk(req.params.id, { raw: true })
      .then(user => {
        if (!user) throw new Error("User didn't exist!")

        return res.render('users/edit', { user })
      })
      .catch(err => next(err))
  },
  putUser: (req, res, next) => {
    // 驗證是否為登入之 user
    if (Number(req.params.id) !== req.user.id) throw new Error('無權限編輯此資料！')

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
      .then(() => {
        req.flash('success_messages', '使用者資料編輯成功')
        res.redirect(`/users/${req.params.id}`)
      })
      .catch(err => next(err))
  },
  addFavorite: (req, res, next) => {
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
      .then(() => {
        req.flash('success_messages', '成功加入最愛！')
        res.redirect('back')
      })
      .catch(err => next(err))
  },
  removeFavorite: (req, res, next) => {
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
      .then(() => {
        req.flash('success_messages', '已從最愛中移除')
        res.redirect('back')
      })
      .catch(err => next(err))
  },
  addLike: (req, res, next) => {
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
      .then(() => {
        req.flash('success_messages', '成功加入喜歡的餐廳')
        res.redirect('back')
      })
      .catch(err => next(err))
  },
  removeLike: (req, res, next) => {
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
      .then(() => {
        req.flash('success_messages', '已從喜歡的餐廳移除')
        res.redirect('back')
      })
  },
  getTopUsers: (req, res, next) => {
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

        res.render('top-users', { users: result, currentUserId: req.user.id })
      })
      .catch(err => next(err))
  },
  addFollowing: (req, res, next) => {
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
      .then(() => {
        req.flash('success_messages', '成功加入追蹤！')
        res.redirect('back')
      })
      .catch(err => next(err))
  },
  removeFollow: (req, res, next) => {
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
      .then(() => {
        req.flash('success_messages', '已取消追蹤')
        res.redirect('back')
      })
      .catch(err => next(err))
  }
}

module.exports = userController

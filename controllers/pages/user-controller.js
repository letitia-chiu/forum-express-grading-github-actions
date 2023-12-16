const { User } = require('../../models')
const userServices = require('../../services/user-services')

const userController = {
  signUpPage: (req, res) => {
    return res.render('signup')
  },
  signUp: (req, res, next) => {
    userServices.signUp(req, (err, data) => {
      if (err) next(err)

      req.flash('success_messages', '成功註冊帳號！')
      res.redirect('/singin')
    })
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
    userServices.getUser(req, (err, data) => err ? next(err) : res.render('users/profile', data))
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
    userServices.putUser(req, (err, data) => {
      if (err) next(err)

      req.flash('success_messages', '使用者資料編輯成功')
      res.redirect(`/users/${req.params.id}`)
    })
  },
  addFavorite: (req, res, next) => {
    userServices.addFavorite(req, (err, data) => {
      if (err) next(err)

      req.flash('success_messages', '成功加入最愛！')
      res.redirect('back')
    })
  },
  removeFavorite: (req, res, next) => {
    userServices.removeFavorite(req, (err, data) => {
      if (err) next(err)

      req.flash('success_messages', '已從最愛中移除')
      res.redirect('back')
    })
  },
  addLike: (req, res, next) => {
    userServices.addLike(req, (err, data) => {
      if (err) next(err)

      req.flash('success_messages', '成功加入喜歡的餐廳！')
      res.redirect('back')
    })
  },
  removeLike: (req, res, next) => {
    userServices.removeLike(req, (err, data) => {
      if (err) next(err)

      req.flash('success_messages', '已從喜歡的餐廳移除')
      res.redirect('back')
    })
  },
  getTopUsers: (req, res, next) => {
    userServices.getTopUsers(req, (err, data) => err ? next(err) : res.render('top-users', data))
  },
  addFollowing: (req, res, next) => {
    userServices.addFollowing(req, (err, data) => {
      if (err) next(err)

      req.flash('success_messages', '成功加入追蹤！')
      res.redirect('back')
    })
  },
  removeFollow: (req, res, next) => {
    userServices.removeFollow(req, (err, data) => {
      if (err) next(err)

      req.flash('success_messages', '已取消追蹤！')
      res.redirect('back')
    })
  }
}

module.exports = userController

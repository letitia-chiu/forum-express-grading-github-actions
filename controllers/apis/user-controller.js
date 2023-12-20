const jwt = require('jsonwebtoken')
const { Token } = require('../../models')
const userServices = require('../../services/user-services')

const userController = {
  signUp: (req, res, next) => {
    userServices.signUp(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  },
  signIn: (req, res, next) => {
    try {
      const userData = req.user.toJSON()
      delete userData.password
      const newToken = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: '30d' })

      return Token.findOne({ where: { userId: userData.id } })
        .then(token => {
          // 若有舊的 token 存在，則更新
          if (token) return token.update({ token: newToken })

          // 若無舊的 token 則加入
          return Token.create({ token: newToken, userId: userData.id })
        })
        .then(() => {
          return res.json({
            status: 'success',
            data: { token: newToken, user: userData }
          })
        })
    } catch (err) {
      next(err)
    }
  },
  logout: (req, res, next) => {
    return Token.findOne({ where: { userId: req.user.id } })
      .then(token => {
        if (!token) throw new Error("Token didn't exist")

        return token.destroy()
      })
      .then(deletedToken => {
        const data = { user: req.user }
        return res.json({ status: 'success', data })
      })
  },
  getUser: (req, res, next) => {
    userServices.getUser(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  },
  putUser: (req, res, next) => {
    userServices.putUser(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  },
  addFavorite: (req, res, next) => {
    userServices.addFavorite(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  },
  removeFavorite: (req, res, next) => {
    userServices.removeFavorite(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  },
  addLike: (req, res, next) => {
    userServices.addLike(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  },
  removeLike: (req, res, next) => {
    userServices.removeLike(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  },
  getTopUsers: (req, res, next) => {
    userServices.getTopUser(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  },
  addFollowing: (req, res, next) => {
    userServices.addFollowing(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  },
  removeFollow: (req, res, next) => {
    userServices.removeFollow(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  }
}

module.exports = userController

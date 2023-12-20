const passport = require('passport')
const LocalStrategy = require('passport-local')
const passportJWT = require('passport-jwt')
const bcrypt = require('bcryptjs')

const { User, Restaurant, Token } = require('../models')

// const ExtractJwt = passportJWT.ExtractJwt
const JwtStrategy = passportJWT.Strategy

// set up Passport strategy
passport.use(new LocalStrategy(
  // customize user field
  {
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  },
  // authenticate user
  (req, email, password, cb) => {
    User.findOne({ where: { email } })
      .then(user => {
        // if (!user) return cb(null, false, req.flash('error_messages', '帳號或密碼輸入錯誤！'))
        // 和 jwt 登入驗證共用時，無法處理 req.flash，故改回傳錯誤訊息由 error-handler 處理
        if (!user) {
          const errMsg = '帳號或密碼輸入錯誤！'
          return cb(errMsg, false)
        }

        bcrypt.compare(password, user.password).then(res => {
          // if (!res) cb(null, false, req.flash('error_messages', '帳號或密碼輸入錯誤！'))
          if (!res) {
            const errMsg = '帳號或密碼輸入錯誤！'
            return cb(errMsg, false)
          }

          return cb(null, user)
        })
      })
  }
))

// JWT setting
// const jwtOptions = {
//   jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//   secretOrKey: process.env.JWT_SECRET,
// }

// 客製化 jwtFromRequest 以取得原始 token 字串
const jwtOptions = {
  jwtFromRequest: function (req) {
    let token = null
    if (req && req.headers.authorization) {
      // 取得並拆分 req.headers.authorization (應為'Bearer [token字串]')
      const parts = req.headers.authorization.split(' ')

      // 確認正確拆分成 'Bearer' 與 token 兩個部分
      if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
        // 將原始 token 字串放入 req.tokenString
        token = parts[1]
        req.tokenString = token
      } else {
        throw new Error('The type of authentication scheme is not Bearer')
      }
    }
    return token
  },
  secretOrKey: process.env.JWT_SECRET,
  passReqToCallback: true
}

passport.use(new JwtStrategy(jwtOptions, (req, jwtPayload, cb) => {
  Promise.all([
    Token.findOne({ where: { token: req.tokenString, userId: jwtPayload.id } }),
    User.findByPk(jwtPayload.id, {
      include: [
        { model: Restaurant, as: 'FavoritedRestaurants' },
        { model: Restaurant, as: 'LikedRestaurants' },
        { model: User, as: 'Followers' },
        { model: User, as: 'Followings' }
      ]
    })
  ])
    .then(([token, user]) => {
      if (!token) throw new Error()

      const userData = user.toJSON()
      delete userData.password
      return cb(null, userData)
    })
    .catch(err => cb(err))
}))

// serialize and deserialize user
passport.serializeUser((user, cb) => {
  cb(null, user.id)
})
passport.deserializeUser((id, cb) => {
  User.findByPk(id, {
    include: [
      { model: Restaurant, as: 'FavoritedRestaurants' },
      { model: Restaurant, as: 'LikedRestaurants' },
      { model: User, as: 'Followers' },
      { model: User, as: 'Followings' }
    ]
  })
    .then(user => cb(null, user.toJSON()))
    .catch(err => cb(err))
})

module.exports = passport

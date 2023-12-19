const passport = require('passport')
const LocalStrategy = require('passport-local')
const passportJWT = require('passport-jwt')
const bcrypt = require('bcryptjs')

const { User, Restaurant } = require('../models')

const ExtractJwt = passportJWT.ExtractJwt
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
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
}

passport.use(new JwtStrategy(jwtOptions, (jwtPayload, cb) => {
  User.findByPk(jwtPayload.id, {
    include: [
      { model: Restaurant, as: 'FavoritedRestaurants' },
      { model: Restaurant, as: 'LikedRestaurants' },
      { model: User, as: 'Followers' },
      { model: User, as: 'Followings' }
    ]
  })
    .then(user => cb(null, user.toJSON()))
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

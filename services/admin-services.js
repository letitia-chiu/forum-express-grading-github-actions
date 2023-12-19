const { Restaurant, User, Category } = require('../models')
const { localFileHandler } = require('../helpers/file-helpers')

const adminServices = {
  getRestaurants: (req, cb) => {
    Restaurant.findAll({
      raw: true,
      nest: true,
      include: [Category]
    })
      .then(restaurants => {
        return cb(null, { restaurants })
      })
      .catch(err => cb(err))
  },
  createRestaurant: (req, cb) => {
    return Category.findAll({ raw: true })
      .then(categories => {
        return cb(null, { categories })
      })
      .catch(err => cb(err))
  },
  postRestaurant: (req, cb) => {
    const { name, tel, address, openingHours, description, categoryId } = req.body
    if (!name) throw new Error('Restaurant name is required!')
    if (!categoryId) throw new Error('Category is required!')

    const { file } = req

    return Promise.all([
      Category.findByPk(categoryId),
      localFileHandler(file)
    ])
      .then(([category, filePath]) => {
        if (!category) throw new Error("Category didn't exist!")

        return Restaurant.create({
          name,
          tel,
          address,
          openingHours,
          description,
          image: filePath || null,
          categoryId
        })
      })
      .then(newRestaurant => {
        return cb(null, { restaurant: newRestaurant })
      })
      .catch(err => cb(err))
  },
  getRestaurant: (req, cb) => {
    Restaurant.findByPk(req.params.id, {
      raw: true,
      nest: true,
      include: [Category]
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")

        return cb(null, { restaurant })
      })
      .catch(err => cb(err))
  },
  editRestaurant: (req, cb) => {
    Promise.all([
      Restaurant.findByPk(req.params.id, {
        raw: true,
        nest: true,
        include: [Category]
      }),
      Category.findAll({ raw: true })
    ])
      .then(([restaurant, categories]) => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")

        return cb(null, { restaurant, categories })
      })
      .catch(err => cb(err))
  },
  putRestaurant: (req, cb) => {
    const { name, tel, address, openingHours, description, categoryId } = req.body
    if (!name) throw new Error('Restaurant name is required!')
    if (!categoryId) throw new Error('Category is required!')

    const { file } = req

    Promise.all([
      Restaurant.findByPk(req.params.id),
      Category.findByPk(categoryId),
      localFileHandler(file)
    ])
      .then(([restaurant, category, filePath]) => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        if (!category) throw new Error("Category didn't exist!")

        return restaurant.update({
          name,
          tel,
          address,
          openingHours,
          description,
          image: filePath || restaurant.image,
          categoryId
        })
      })
      .then(updatedRestaurant => {
        return cb(null, { restaurant: updatedRestaurant })
      })
      .catch(err => cb(err))
  },
  deleteRestaurant: (req, cb) => {
    Restaurant.findByPk(req.params.id)
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")

        return restaurant.destroy()
      })
      .then(deletedRestaurant => {
        req.flash('success_messages', 'restaurant was successfully deleted')
        return cb(null, { restaurant: deletedRestaurant })
      })
      .catch(err => cb(err))
  },
  getUsers: (req, cb) => {
    return User.findAll({
      attributes: { exclude: ['password'] },
      raw: true
    })
      .then(users => {
        return cb(null, { users })
      })
      .catch(err => cb(err))
  },
  patchUser: (req, cb) => {
    return User.findByPk(req.params.id)
      .then(user => {
        if (!user) throw new Error("User didn't exist!")
        if (user.email === 'root@example.com') throw new Error('禁止變更 root 權限')

        return user.update({ isAdmin: !user.isAdmin })
      })
      .then(updatedUser => {
        const userData = updatedUser.toJSON()
        delete userData.password
        return cb(null, { user: userData })
      })
      .catch(err => cb(err))
  }
}

module.exports = adminServices

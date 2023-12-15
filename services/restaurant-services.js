const { Restaurant, Category, Comment, User, Favorite } = require('../models')
const { getOffset, getPagination } = require('../helpers/pagination-helper')

const restaurantServices = {
  getRestaurants: (req, cb) => {
    const DEFAULT_LIMIT = 9

    const categoryId = Number(req.query.categoryId) || ''

    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || DEFAULT_LIMIT
    const offset = getOffset(limit, page)

    return Promise.all([
      Restaurant.findAndCountAll({
        where: {
          ...categoryId ? { categoryId } : {}
        },
        limit,
        offset,
        raw: true,
        nest: true,
        include: [Category]
      }),
      Category.findAll({ raw: true })
    ])
      .then(([restaurants, categories]) => {
        const data = restaurants.rows.map(r => ({
          ...r,
          description: r.description ? r.description.substring(0, 50) : null,
          isFavorited: req.user && req.user.FavoritedRestaurants.some(fr => fr.id === r.id),
          isLiked: req.user && req.user.LikedRestaurants.some(lr => lr.id === r.id)
        }))
        return cb(null, {
          restaurants: data,
          categories,
          categoryId,
          pagination: getPagination(limit, page, restaurants.count)
        })
      })
      .catch(err => cb(err))
  },
  getRestaurant: (req, cb) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        { model: Comment, include: User }
      ]
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")

        return restaurant.increment('viewCounts')
      })
      .then(restaurant => {
        const isFavorited = req.user.FavoritedRestaurants.some(fr => fr.id === restaurant.id)
        const isLiked = req.user.LikedRestaurants.some(lr => lr.id === restaurant.id)

        return cb(null, {
          restaurant: restaurant.toJSON(),
          isFavorited,
          isLiked
        })
      })
      .catch(err => cb(err))
  },
  getDashboard: (req, cb) => {
    const restaurantId = req.params.id
    return Promise.all([
      Restaurant.findByPk(restaurantId, {
        raw: true,
        nest: true,
        include: [Category]
      }),
      Comment.count({ where: { restaurantId } }),
      Favorite.count({ where: { restaurantId } })
    ])
      .then(([restaurant, commentCounts, favoriteCounts]) => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")

        return cb(null, {
          restaurant,
          commentCounts,
          favoriteCounts
        })
      })
      .catch(err => cb(err))
  },
  getFeeds: (req, cb) => {
    return Promise.all([
      Restaurant.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [Category],
        raw: true,
        nest: true
      }),
      Comment.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [User, Restaurant],
        raw: true,
        nest: true
      })
    ])
      .then(([restaurants, comments]) => {
        return cb(null, { restaurants, comments })
      })
      .catch(err => cb(err))
  },
  getTopRestaurants: (req, cb) => {
    return Restaurant.findAll({
      include: [
        { model: User, as: 'FavoritedUsers' }
      ]
    })
      .then(restaurants => {
        const result = restaurants.map(r => ({
          ...r.toJSON(),
          description: r.description.length > 100 ? r.description.substring(0, 100) + '...' : r.description,
          favoritedCount: r.FavoritedUsers.length,
          isFavorited: req.user && req.user.FavoritedRestaurants.some(fr => fr.id === r.id)
        }))
          .sort((a, b) => b.favoritedCount - a.favoritedCount)
          .slice(0, 10)

        return cb(null, { restaurants: result })
      })
      .catch(err => cb(err))
  }
}

module.exports = restaurantServices

const { Op } = require('sequelize')
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
        {
          model: Comment,
          include: [{ model: User, attributes: { exclude: ['password'] } }]
        }
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
        include: [
          { model: User, attributes: { exclude: ['password'] } },
          Restaurant
        ],
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
    return Favorite.findAndCountAll({
      group: ['restaurantId'],
      attributes: ['restaurantId'],
      raw: true
    })
      .then(favorites => {
        // 若沒有餐廳被收藏，則以瀏覽次數排前10名
        if (!favorites) {
          return Restaurant.findAll({
            order: [['viewCounts', 'DESC'], ['id', 'ASC']],
            limit: 10,
            raw: true
          })
        }

        const favoritedIds = favorites.count.map(f => f.restaurantId)

        // 若被收藏過的餐廳數不滿 10 間
        if (favorites.count.length < 10) {
          return Promise.all([
            Restaurant.findAll({
              where: { id: { [Op.in]: favoritedIds } },
              raw: true
            }),
            favorites.count,
            Restaurant.findAll({
              where: { id: { [Op.notIn]: favoritedIds } },
              order: [['viewCounts', 'DESC'], ['id', 'ASC']],
              limit: 10 - favorites.count.length,
              raw: true
            })
          ])

        // 若被收藏過的餐廳數達 10 間
        } else {
          return Promise.all([
            Restaurant.findAll({
              where: { id: { [Op.in]: favoritedIds } },
              raw: true
            }),
            favorites.count
          ])
        }
      })
      .then(([rests1, favorites, rests2]) => {
        const restaurants = rests2 ? [...rests1, ...rests2] : rests1
        const result = restaurants.map(r => ({
          ...r,
          description: r.description.length > 100 ? r.description.substring(0, 100) + '...' : r.description,
          isFavorited: req.user && req.user.FavoritedRestaurants.some(fr => fr.id === r.id),
          favoritedCount: favorites.find(f => f.restaurantId === r.id) ? favorites.find(f => f.restaurantId === r.id).count : 0
        }))
          .sort((a, b) => a.id - b.id)
          .sort((a, b) => b.viewCounts - a.viewCounts)
          .sort((a, b) => b.favoritedCount - a.favoritedCount)

        return cb(null, { restaurants: result })
      })
      .catch(err => cb(err))
  }
}

module.exports = restaurantServices

const categoryServices = require('../../services/category-services')

const categoryController = {
  // 與 'GET /categories'、'GET /categories/:id' 共用
  getCategories: (req, res, next) => {
    categoryServices.getCategories(req, (err, data) => {
      if (err) return next(err)
      if (req.params.id && !data.category) throw new Error("Category didn't exist!")

      res.json({
        status: 'success',
        data: req.params.id ? { category: data.category } : data
      })
    })
  },
  postCategory: (req, res, next) => {
    categoryServices.postCategory(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  },
  putCategory: (req, res, next) => {
    categoryServices.putCategory(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  },
  deleteCategory: (req, res, next) => {
    categoryServices.deleteCategory(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  }
}

module.exports = categoryController

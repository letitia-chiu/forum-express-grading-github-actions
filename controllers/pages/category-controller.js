const categoryServices = require('../../services/category-services')

const categoryController = {
  // 與 'GET /categories'、'GET /categories/:id' 共用
  getCategories: (req, res, next) => {
    categoryServices.getCategories(req, (err, data) => err ? next(err) : res.render('admin/categories', data))
  },
  postCategory: (req, res, next) => {
    categoryServices.postCategory(req, (err, data) => {
      if (err) return next(err)

      req.flash('success_messages', 'category was successfully created!')
      res.redirect('/admin/categories')
    })
  },
  putCategory: (req, res, next) => {
    categoryServices.putCategory(req, (err, data) => {
      if (err) return next(err)

      req.flash('success_messages', 'Category was successfully updated!')
      res.redirect('/admin/categories')
    })
  },
  deleteCategory: (req, res, next) => {
    categoryServices.deleteCategory(req, (err, data) => {
      if (err) return next(err)

      req.flash('success_messages', 'Category was successfully deleted!')
      res.redirect('/admin/categories')
    })
  }
}

module.exports = categoryController

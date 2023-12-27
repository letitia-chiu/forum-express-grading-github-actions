const { Category, Restaurant } = require('../models')

const categoryServices = {
  // 與 'GET /categories'、'GET /categories/:id' 共用
  getCategories: (req, cb) => {
    return Promise.all([
      Category.findAll({ raw: true }),
      req.params.id ? Category.findByPk(req.params.id, { raw: true }) : null
    ])
      .then(([categories, category]) => {
        return cb(null, { categories, category })
      })
      .catch(err => cb(err))
  },
  postCategory: (req, cb) => {
    const { name } = req.body
    if (!name) throw new Error('Category name is required!')

    return Category.findOne({ where: { name } })
      .then(category => {
        if (category) throw new Error('Category name already existed!')

        return Category.create({ name })
      })
      .then(newCategory => {
        return cb(null, { category: newCategory })
      })
      .catch(err => cb(err))
  },
  putCategory: (req, cb) => {
    const { name } = req.body
    if (!name) throw new Error('Category name is required!')

    return Promise.all([
      Category.findByPk(req.params.id),
      Category.findOne({ where: { name } })
    ])
      .then(([editCategory, existedCategory]) => {
        if (!editCategory) throw new Error("Category didn't exist!")
        if (existedCategory && existedCategory.name === name) throw new Error('Category name already existed!')

        return editCategory.update({ name })
      })
      .then(updatedCategory => {
        return cb(null, { category: updatedCategory })
      })
      .catch(err => cb(err))
  },
  deleteCategory: (req, cb) => {
    return Promise.all([
      Category.findByPk(req.params.id),
      Restaurant.findOne({ where: { categoryId: req.params.id } })
    ])
      .then(([category, restaurant]) => {
        if (!category) throw new Error("Category didn't exist!")
        if (restaurant) throw new Error('This category is in use')

        return category.destroy()
      })
      .then(deletedCategory => {
        return cb(null, { category: deletedCategory })
      })
      .catch(err => cb(err))
  }
}

module.exports = categoryServices

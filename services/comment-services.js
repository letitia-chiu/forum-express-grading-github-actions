const { Comment, User, Restaurant } = require('../models')

const commentController = {
  postComment: (req, cb) => {
    const { restaurantId, text } = req.body
    const userId = req.user.id

    if (!text || text.trim().length === 0) throw new Error('Comment text is required!')

    return Promise.all([
      User.findByPk(userId),
      Restaurant.findByPk(restaurantId)
    ])
      .then(([user, restaurant]) => {
        if (!user) throw new Error("User didn't exist!")
        if (!restaurant) throw new Error("Restaurant didn't exist!")

        return Comment.create({ text, restaurantId, userId })
      })
      .then(newComment => {
        return cb(null, { comment: newComment })
      })
      .catch(err => cb(err))
  },
  deleteComment: (req, cb) => {
    return Comment.findByPk(req.params.id)
      .then(comment => {
        if (!comment) throw new Error("Comment didn't exist!")

        return comment.destroy()
      })
      .then(deletedComment => {
        return cb(null, { comment: deletedComment })
      })
      .catch(err => cb(err))
  }
}

module.exports = commentController

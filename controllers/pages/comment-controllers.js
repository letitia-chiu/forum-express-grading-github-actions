const commentServices = require('../../services/comment-services')

const commentController = {
  postComment: (req, res, next) => {
    commentServices.postComment(req, (err, data) => {
      if (err) return next(err)

      req.flash('success_messages', '已新增評論！')
      res.redirect(`/restaurants/${data.comment.restaurantId}`)
    })
  },
  deleteComment: (req, res, next) => {
    commentServices.deleteComment(req, (err, data) => {
      if (err) return next(err)

      req.flash('success_messages', '已刪除評論！')
      res.redirect(`/restaurants/${data.comment.restaurantId}`)
    })
  }
}

module.exports = commentController

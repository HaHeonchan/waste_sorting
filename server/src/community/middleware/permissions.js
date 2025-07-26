const Post = require('../models/Post');
const Comment = require('../models/Comment');
const mongoose = require('mongoose');

// 게시글 작성자 확인 미들웨어
const isPostAuthor = async (req, res, next) => {
  try {
    const { post_id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(post_id)) {
      return res.status(400).json({ message: '잘못된 게시글 ID입니다.' });
    }

    const post = await Post.findById(post_id);
    if (!post) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }
    
        const userId = req.user?.user_id || req.user?.id || req.user?.email || 1;
    if (post.user_id !== userId) {
        return res.status(403).json({ message: '게시글 수정/삭제 권한이 없습니다.' });
    }
    
    req.post = post; // 다음 미들웨어에서 사용할 수 있도록 저장
    next();
  } catch (error) {
    console.error('게시글 작성자 확인 에러:', error);
    res.status(500).json({ message: '권한 확인 중 오류가 발생했습니다.' });
  }
};

// 댓글 작성자 확인 미들웨어
const isCommentAuthor = async (req, res, next) => {
  try {
    const { comment_id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(comment_id)) {
      return res.status(400).json({ message: '잘못된 댓글 ID입니다.' });
    }

    const comment = await Comment.findById(comment_id);
    if (!comment) {
      return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
    }
    
        const userId = req.user?.user_id || req.user?.id || req.user?.email || 1;
    if (comment.user_id !== userId) {
        return res.status(403).json({ message: '댓글 수정/삭제 권한이 없습니다.' });
    }
    
    req.comment = comment; // 다음 미들웨어에서 사용할 수 있도록 저장
    next();
  } catch (error) {
    console.error('댓글 작성자 확인 에러:', error);
    res.status(500).json({ message: '권한 확인 중 오류가 발생했습니다.' });
  }
};

// 로그인 필수 미들웨어 (이미 auth.js에 있지만 명확성을 위해)
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: '로그인이 필요한 기능입니다.' });
  }
  next();
};

module.exports = {
  isPostAuthor,
  isCommentAuthor,
  requireAuth
}; 
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 컨트롤러와 미들웨어 import
const communityController = require('../controllers/community');
const authMiddleware = require('../../auth/middleware/auth');
const { isPostAuthor, isCommentAuthor } = require('../middleware/permissions');

// 임시 파일 저장을 위한 multer 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB 제한
  },
  fileFilter: (req, file, cb) => {
    // 이미지 파일만 허용
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
    }
  }
});

// 게시글 관련 라우트
// GET /api/community/posts - 게시글 목록 조회 (인증 불필요)
router.get('/posts', communityController.listPosts);

// POST /api/community/posts - 게시글 작성 (인증 필수)
router.post('/posts', authMiddleware, upload.single('image'), communityController.createPost);

// PUT /api/community/posts/:post_id - 게시글 수정 (작성자만)
router.put('/posts/:post_id', authMiddleware, isPostAuthor, upload.single('image'), communityController.updatePost);

// DELETE /api/community/posts/:post_id - 게시글 삭제 (작성자만)
router.delete('/posts/:post_id', authMiddleware, isPostAuthor, communityController.deletePost);

// POST /api/community/posts/:post_id/like - 게시글 좋아요 (인증 필수)
router.post('/posts/:post_id/like', authMiddleware, communityController.likePost);

// 댓글 관련 라우트
// GET /api/community/posts/:post_id/comments - 댓글 목록 조회 (인증 불필요)
router.get('/posts/:post_id/comments', communityController.listComments);

// POST /api/community/posts/:post_id/comments - 댓글 작성 (인증 필수)
router.post('/posts/:post_id/comments', authMiddleware, communityController.createComment);

// PUT /api/community/comments/:comment_id - 댓글 수정 (작성자만)
router.put('/comments/:comment_id', authMiddleware, isCommentAuthor, communityController.updateComment);

// DELETE /api/community/comments/:comment_id - 댓글 삭제 (작성자만)
router.delete('/comments/:comment_id', authMiddleware, isCommentAuthor, communityController.deleteComment);

// POST /api/community/comments/:comment_id/like - 댓글 좋아요 (인증 필수)
router.post('/comments/:comment_id/like', authMiddleware, communityController.likeComment);

module.exports = router; 
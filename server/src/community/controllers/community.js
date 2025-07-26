const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../../auth/models/User');
const mongoose = require('mongoose');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// 1. 게시글 목록 조회 (정렬 + 페이지네이션 + 카테고리 필터)
exports.listPosts = async (req, res) => {
    try {
        let { sort = 'date', order = 'desc', page = 1, limit = 10, category } = req.query;

        page = parseInt(page);
        limit = parseInt(limit);

        const validSorts = ['likes', 'date', 'comments'];
        if (!validSorts.includes(sort)) sort = 'date';

        const sortKey = sort === 'likes' ? 'likes' : sort === 'comments' ? 'comment_count' : 'created_at';
        const sortOption = order === 'asc' ? 1 : -1;

        // 필터 조건 구성
        const filter = {};
        if (category && category !== '전체') {
            filter.category = category;
        }

        const total = await Post.countDocuments(filter);
        const posts = await Post.find(filter)
            .sort({ [sortKey]: sortOption })
            .skip((page - 1) * limit)
            .limit(limit);

        // 사용자 정보 조회
        const userIds = [...new Set(posts.map(post => post.user_id))];
        const users = await User.find({ 
            $or: [
                { email: { $in: userIds } },
                { _id: { $in: userIds.filter(id => mongoose.Types.ObjectId.isValid(id)) } }
            ]
        });

        // 사용자 정보를 게시글에 추가
        const data = posts.map(post => {
            const user = users.find(u => u.email === post.user_id || u._id.toString() === post.user_id);
            return {
                ...post.toObject(),
                user_name: user ? (user.name || user.displayName || user.email.split('@')[0]) : '알 수 없음',
                user_email: user ? user.email : null
            };
        });

        res.json({ total, page, limit, data });
    } catch (err) {
        console.error('게시글 목록 조회 에러:', err);
        res.status(500).json({ message: '게시글 목록 조회 실패', error: err.message });
    }
};

// 2. 게시글 작성 (Cloudinary 업로드)
exports.createPost = async (req, res) => {
    try {
        let image_url = '';

        // 이미지 업로드 처리
        if (req.file) {
            console.log('📸 게시글 이미지 Cloudinary 업로드 시작:', req.file.filename);
            
            try {
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'waste-sorting/community',
                    resource_type: 'auto',
                    quality: 'auto:good',
                    fetch_format: 'auto',
                    transformation: [
                        { width: 1200, height: 1200, crop: 'limit' },
                        { quality: 'auto:good' }
                    ]
                });
                
                image_url = result.secure_url;
                console.log('✅ Cloudinary 업로드 완료:', image_url);
                
                fs.unlinkSync(req.file.path);
                console.log('🗑️ 임시 파일 삭제 완료');
                
            } catch (uploadError) {
                console.error('🔥 Cloudinary 업로드 실패:', uploadError);
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(500).json({ message: '이미지 업로드 실패', error: uploadError.message });
            }
        } else {
            image_url = req.body.image_url || '';
        }

        const { title, content, category } = req.body;
        if (!title || !content || !category) {
            return res.status(400).json({ message: '제목, 내용, 카테고리는 필수입니다' });
        }

        // 사용자 정보 디버깅 및 안전한 처리
        console.log('🔍 사용자 정보 확인:', {
            user: req.user,
            userId: req.user?.user_id,
            email: req.user?.email,
            id: req.user?.id
        });

        // 다양한 사용자 ID 필드 확인
        const userId = req.user?.user_id || req.user?.id || req.user?.email || 1;
        
        if (!userId) {
            return res.status(401).json({ message: '사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.' });
        }

        const newPost = await Post.create({
            user_id: userId,
            title,
            content,
            category,
            image_url,
            likes: 0,
            liked_by: [],
            comment_count: 0
        });

        res.status(201).json({ 
            message: '게시글 작성 완료', 
            post_id: newPost._id,
            image_url: image_url
        });
    } catch (err) {
        console.error('게시글 작성 에러:', err);
        res.status(500).json({ message: '게시글 작성 실패', error: err.message });
    }
};

// 3. 게시글 수정
exports.updatePost = async (req, res) => {
    try {
        const { post_id } = req.params;
        const { title, content, category } = req.body;

        if (!mongoose.Types.ObjectId.isValid(post_id)) {
            return res.status(400).json({ message: '잘못된 게시글 ID' });
        }

        const userId = req.user?.user_id || req.user?.id || req.user?.email || 1;
        const post = await Post.findOne({ _id: post_id, user_id: userId });
        if (!post) return res.status(404).json({ message: '수정할 게시글 없음' });

        // 새 이미지 업로드 처리
        if (req.file) {
            console.log('📸 게시글 이미지 수정 Cloudinary 업로드 시작:', req.file.filename);
            
            try {
                // 기존 이미지가 Cloudinary URL인 경우 삭제
                if (post.image_url && post.image_url.includes('cloudinary.com')) {
                    const urlParts = post.image_url.split('/');
                    const filename = urlParts[urlParts.length - 1];
                    const publicId = filename.split('.')[0];
                    const fullPublicId = `waste-sorting/community/${publicId}`;
                    
                    console.log('🗑️ 기존 Cloudinary 이미지 삭제 시작 (비동기):', fullPublicId);
                    
                    cloudinary.uploader.destroy(fullPublicId)
                        .then(() => console.log('🗑️ 기존 Cloudinary 이미지 삭제 완료'))
                        .catch(error => console.error('🔥 기존 Cloudinary 이미지 삭제 실패:', error.message));
                }
                
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'waste-sorting/community',
                    resource_type: 'auto',
                    quality: 'auto:good',
                    fetch_format: 'auto',
                    transformation: [
                        { width: 1200, height: 1200, crop: 'limit' },
                        { quality: 'auto:good' }
                    ]
                });
                
                post.image_url = result.secure_url;
                console.log('✅ Cloudinary 수정 업로드 완료:', post.image_url);
                
                fs.unlinkSync(req.file.path);
                console.log('🗑️ 임시 파일 삭제 완료');
                
            } catch (uploadError) {
                console.error('🔥 Cloudinary 업로드 실패:', uploadError);
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(500).json({ message: '이미지 업로드 실패', error: uploadError.message });
            }
        }

        // 텍스트 필드 업데이트
        if ('title' in req.body) post.title = title;
        if ('content' in req.body) post.content = content;
        if ('category' in req.body) post.category = category;

        await post.save();
        res.json({ 
            message: '게시글 수정 완료',
            image_url: post.image_url
        });
    } catch (err) {
        console.error('게시글 수정 에러:', err);
        res.status(500).json({ message: '게시글 수정 실패', error: err.message });
    }
};

// 4. 게시글 삭제
exports.deletePost = async (req, res) => {
    try {
        const { post_id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(post_id)) {
            return res.status(400).json({ message: '잘못된 게시글 ID' });
        }

        const userId = req.user?.user_id || req.user?.id || req.user?.email || 1;
        const post = await Post.findOne({ _id: post_id, user_id: userId });
        
        if (!post) {
            return res.status(404).json({ message: '삭제할 게시글 없음' });
        }

        // Cloudinary에서 이미지 삭제
        if (post.image_url && post.image_url.includes('cloudinary.com')) {
            const urlParts = post.image_url.split('/');
            const filename = urlParts[urlParts.length - 1];
            const publicId = filename.split('.')[0];
            const fullPublicId = `waste-sorting/community/${publicId}`;
            
            console.log('🗑️ Cloudinary 이미지 삭제 시작 (비동기):', fullPublicId);
            
            cloudinary.uploader.destroy(fullPublicId)
                .then(() => console.log('🗑️ Cloudinary 이미지 삭제 완료'))
                .catch(error => console.error('🔥 Cloudinary 이미지 삭제 실패:', error.message));
        }

        // 관련 댓글들도 함께 삭제
        await Comment.deleteMany({ post_id: post_id });

        // 게시글 삭제
        await Post.deleteOne({ _id: post_id });
        
        res.status(200).json({ message: '게시글 삭제 완료', deletedId: post_id });
    } catch (err) {
        console.error('게시글 삭제 에러:', err);
        res.status(500).json({ message: '게시글 삭제 실패', error: err.message });
    }
};

// 5. 게시글 좋아요
exports.likePost = async (req, res) => {
    try {
        const { post_id } = req.params;
        const userId = req.user?.user_id || req.user?.id || req.user?.email || 1;
        
        if (!mongoose.Types.ObjectId.isValid(post_id)) {
            return res.status(400).json({ message: '잘못된 게시글 ID' });
        }

        const post = await Post.findById(post_id);
        if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없음' });

        // 이미 좋아요를 눌렀는지 확인
        const alreadyLiked = post.liked_by.includes(userId);
        
        if (alreadyLiked) {
            // 좋아요 취소
            post.liked_by = post.liked_by.filter(id => id !== userId);
            post.likes = Math.max(0, post.likes - 1);
        } else {
            // 좋아요 추가
            post.liked_by.push(userId);
            post.likes = post.likes + 1;
        }

        await post.save();

        res.json({ 
            message: alreadyLiked ? '좋아요 취소 완료' : '좋아요 완료', 
            likes: post.likes,
            isLiked: !alreadyLiked
        });
    } catch (err) {
        console.error('게시글 좋아요 에러:', err);
        res.status(500).json({ message: '좋아요 처리 실패', error: err.message });
    }
};

// 6. 댓글 목록 조회
exports.listComments = async (req, res) => {
    try {
        const { post_id } = req.params;
        const { page = 1, limit = 20 } = req.query;

        if (!mongoose.Types.ObjectId.isValid(post_id)) {
            return res.status(400).json({ message: '잘못된 게시글 ID' });
        }

        const total = await Comment.countDocuments({ post_id });
        const comments = await Comment.find({ post_id })
            .sort({ created_at: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // 사용자 정보 조회
        const userIds = [...new Set(comments.map(comment => comment.user_id))];
        const users = await User.find({ 
            $or: [
                { email: { $in: userIds } },
                { _id: { $in: userIds.filter(id => mongoose.Types.ObjectId.isValid(id)) } }
            ]
        });

        // 사용자 정보를 댓글에 추가
        const data = comments.map(comment => {
            const user = users.find(u => u.email === comment.user_id || u._id.toString() === comment.user_id);
            return {
                ...comment.toObject(),
                user_name: user ? (user.name || user.displayName || user.email.split('@')[0]) : '알 수 없음',
                user_email: user ? user.email : null
            };
        });

        res.json({ total, page: parseInt(page), limit: parseInt(limit), data });
    } catch (err) {
        console.error('댓글 목록 조회 에러:', err);
        res.status(500).json({ message: '댓글 목록 조회 실패', error: err.message });
    }
};

// 7. 댓글 작성
exports.createComment = async (req, res) => {
    try {
        const { post_id } = req.params;
        const { content } = req.body;
        const userId = req.user?.user_id || req.user?.id || req.user?.email || 1;

        if (!mongoose.Types.ObjectId.isValid(post_id)) {
            return res.status(400).json({ message: '잘못된 게시글 ID' });
        }

        if (!content || content.trim() === '') {
            return res.status(400).json({ message: '댓글 내용은 필수입니다' });
        }

        // 게시글 존재 확인
        const post = await Post.findById(post_id);
        if (!post) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다' });
        }

        const newComment = await Comment.create({
            post_id,
            user_id: userId,
            content: content.trim(),
            likes: 0,
            liked_by: []
        });

        // 게시글의 댓글 수 증가
        post.comment_count = (post.comment_count || 0) + 1;
        await post.save();

        res.status(201).json({ 
            message: '댓글 작성 완료', 
            comment: newComment
        });
    } catch (err) {
        console.error('댓글 작성 에러:', err);
        res.status(500).json({ message: '댓글 작성 실패', error: err.message });
    }
};

// 8. 댓글 수정
exports.updateComment = async (req, res) => {
    try {
        const { comment_id } = req.params;
        const { content } = req.body;
        const userId = req.user?.user_id || req.user?.id || req.user?.email || 1;

        if (!mongoose.Types.ObjectId.isValid(comment_id)) {
            return res.status(400).json({ message: '잘못된 댓글 ID' });
        }

        if (!content || content.trim() === '') {
            return res.status(400).json({ message: '댓글 내용은 필수입니다' });
        }

        const comment = await Comment.findOne({ _id: comment_id, user_id: userId });
        if (!comment) {
            return res.status(404).json({ message: '수정할 댓글을 찾을 수 없습니다' });
        }

        comment.content = content.trim();
        await comment.save();

        res.json({ message: '댓글 수정 완료', comment });
    } catch (err) {
        console.error('댓글 수정 에러:', err);
        res.status(500).json({ message: '댓글 수정 실패', error: err.message });
    }
};

// 9. 댓글 삭제
exports.deleteComment = async (req, res) => {
    try {
        const { comment_id } = req.params;
        const userId = req.user?.user_id || req.user?.id || req.user?.email || 1;

        if (!mongoose.Types.ObjectId.isValid(comment_id)) {
            return res.status(400).json({ message: '잘못된 댓글 ID' });
        }

        const comment = await Comment.findOne({ _id: comment_id, user_id: userId });
        if (!comment) {
            return res.status(404).json({ message: '삭제할 댓글을 찾을 수 없습니다' });
        }

        // 게시글의 댓글 수 감소
        const post = await Post.findById(comment.post_id);
        if (post) {
            post.comment_count = Math.max(0, (post.comment_count || 0) - 1);
            await post.save();
        }

        await Comment.deleteOne({ _id: comment_id });

        res.json({ message: '댓글 삭제 완료', deletedId: comment_id });
    } catch (err) {
        console.error('댓글 삭제 에러:', err);
        res.status(500).json({ message: '댓글 삭제 실패', error: err.message });
    }
};

// 10. 댓글 좋아요
exports.likeComment = async (req, res) => {
    try {
        const { comment_id } = req.params;
        const userId = req.user?.user_id || req.user?.id || req.user?.email || 1;
        
        if (!mongoose.Types.ObjectId.isValid(comment_id)) {
            return res.status(400).json({ message: '잘못된 댓글 ID' });
        }

        const comment = await Comment.findById(comment_id);
        if (!comment) return res.status(404).json({ message: '댓글을 찾을 수 없음' });

        // 이미 좋아요를 눌렀는지 확인
        const alreadyLiked = comment.liked_by.includes(userId);
        
        if (alreadyLiked) {
            // 좋아요 취소
            comment.liked_by = comment.liked_by.filter(id => id !== userId);
            comment.likes = Math.max(0, comment.likes - 1);
        } else {
            // 좋아요 추가
            comment.liked_by.push(userId);
            comment.likes = comment.likes + 1;
        }

        await comment.save();

        res.json({ 
            message: alreadyLiked ? '좋아요 취소 완료' : '좋아요 완료', 
            likes: comment.likes,
            isLiked: !alreadyLiked
        });
    } catch (err) {
        console.error('댓글 좋아요 에러:', err);
        res.status(500).json({ message: '좋아요 처리 실패', error: err.message });
    }
}; 
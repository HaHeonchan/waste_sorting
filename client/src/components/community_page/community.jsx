import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "./community.css";
import apiClient from '../../utils/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from "framer-motion";
import AnimatedLoadingSpinner from "../loading_components/AnimatedLoadingSpinner";

const categoryOptions = [
  { value: '질문', label: '질문' },
  { value: '제보', label: '제보' },
  { value: '정보', label: '정보' },
  { value: '기타', label: '기타' }
];

const categoryDescriptions = {
  '질문': '분리배출 방법에 대한 질문',
  '제보': '불법 배출 현장 제보',
  '정보': '분리배출 관련 유용한 정보 공유',
  '기타': '기타 분리배출 관련 이야기'
};

export default function Community() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState(null);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState("");
  const [commentPage, setCommentPage] = useState(1);
  const [commentTotalPages, setCommentTotalPages] = useState(1);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    document.title = "분리배출 커뮤니티";
    fetchPosts();
  }, [authLoading, sortBy, sortOrder, page, selectedCategory]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const sortParam = sortBy === "created_at" ? "date" : sortBy;
      const url = `/api/community/posts?sort=${sortParam}&order=${sortOrder}&page=${page}&limit=5&category=${selectedCategory}`;
      const result = await apiClient.requestWithRetry(url);
      setPosts(result.data || []);
      setTotalPages(Math.ceil((result.total || 0) / (result.limit || 5)));
    } catch (error) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      setPosts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId, page = 1) => {
    try {
      const url = `/api/community/posts/${postId}/comments?page=${page}&limit=10`;
      const result = await apiClient.requestWithRetry(url);
      setComments(result.data || []);
      setCommentTotalPages(Math.ceil((result.total || 0) / (result.limit || 10)));
      setCommentPage(page);
    } catch (error) {
      console.error('댓글 로딩 실패:', error);
      setComments([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploading) return;
    
    try {
      setUploading(true);
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("category", category);
      if (image) formData.append("image", image);
      
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);
      
      await apiClient.requestWithRetry('/api/community/posts', {
        method: "POST",
        body: formData,
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setShowForm(false);
        resetForm();
        fetchPosts();
        setUploading(false);
        setUploadProgress(0);
      }, 500);
      
    } catch (error) {
      console.error('게시글 작성 중 오류:', error);
      alert('게시글 작성 중 오류가 발생했습니다.');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id) => {
    if (deletingIds.has(id)) {
      return;
    }
    
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      setDeletingIds(prev => new Set(prev).add(id));
      
      await apiClient.requestWithRetry(`/api/community/posts/${id}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('삭제 성공:', id);
      setPosts(prev => prev.filter(post => post._id !== id));
      
      setTimeout(() => {
        fetchPosts();
      }, 1000);
    } catch (error) {
      console.error('삭제 중 오류:', error);
      alert(`삭제 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleEdit = async (e, id) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("category", category);
      if (image) formData.append("image", image);
      
      await apiClient.requestWithRetry(`/api/community/posts/${id}`, {
        method: "PUT",
        body: formData,
      });
      setShowEditForm(null);
      resetForm();
      fetchPosts();
    } catch (error) {
      alert('수정 중 오류');
    }
  };

  const handleLike = async (id) => {
    try {
      await apiClient.requestWithRetry(`/api/community/posts/${id}/like`, { method: "POST" });
      fetchPosts();
    } catch (error) {
      alert('좋아요 처리 중 오류');
    }
  };

  const handleCommentSubmit = async (e, postId) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    
    try {
      await apiClient.requestWithRetry(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: commentContent })
      });
      
      setCommentContent("");
      fetchComments(postId, 1);
      fetchPosts(); // 댓글 수 업데이트를 위해 게시글 목록 새로고침
    } catch (error) {
      alert('댓글 작성 중 오류가 발생했습니다.');
    }
  };

  const handleCommentDelete = async (commentId, postId) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    
    try {
      await apiClient.requestWithRetry(`/api/community/comments/${commentId}`, {
        method: "DELETE"
      });
      
      fetchComments(postId, commentPage);
      fetchPosts(); // 댓글 수 업데이트를 위해 게시글 목록 새로고침
    } catch (error) {
      alert('댓글 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleCommentLike = async (commentId) => {
    try {
      await apiClient.requestWithRetry(`/api/community/comments/${commentId}/like`, { method: "POST" });
      if (selectedPost) {
        fetchComments(selectedPost._id, commentPage);
      }
    } catch (error) {
      alert('댓글 좋아요 처리 중 오류');
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setCategory("");
    setImage(null);
  };

  const isAuthor = (post) => {
    if (!user) return false;
    const userId = user.user_id || user.id || user.email;
    return userId && post.user_id === userId;
  };

  const isCommentAuthor = (comment) => {
    if (!user) return false;
    const userId = user.user_id || user.id || user.email;
    return userId && comment.user_id === userId;
  };

  const openPostDetail = async (post) => {
    setSelectedPost(post);
    await fetchComments(post._id, 1);
  };

  const closePostDetail = () => {
    setSelectedPost(null);
    setComments([]);
    setCommentContent("");
  };

  if (authLoading) {
    return (
      <AnimatedLoadingSpinner message="인증 상태를 확인하는 중..." />
    );
  }

  // 로그인하지 않은 사용자도 게시글을 볼 수 있도록 null 반환 제거

  return (
    <motion.div
      className="community-wrapper"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75 }}
    >
      <h1 className="community-title">🌱 분리배출 커뮤니티</h1>

      <div className="community-controls">
        {isAuthenticated && (
          <button onClick={() => setShowForm(!showForm)} className="community-button">
            + 게시글 작성
          </button>
        )}
        <div className="community-filters">
          <select 
            value={selectedCategory} 
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="전체">전체 카테고리</option>
            {categoryOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="created_at">시간순</option>
            <option value="likes">좋아요순</option>
            <option value="comment_count">댓글순</option>
          </select>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="desc">내림차순</option>
            <option value="asc">오름차순</option>
          </select>
        </div>
      </div>

      {showForm && (
        <div className="community-form">
          <h2>게시글 작성</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목 입력"
              required
            />

            <div className="category-select-container">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">-- 카테고리 선택 --</option>
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {category && (
                <div className="category-description">
                  💡 {categoryDescriptions[category]}
                </div>
              )}
            </div>

            <div
              className="community-dropzone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith("image/")) {
                  setImage(file);
                }
              }}
              onClick={() => document.getElementById("hiddenFileInput").click()}
            >
              {image ? (
                <div className="community-preview">
                  <img src={URL.createObjectURL(image)} alt="미리보기" />
                  <button type="button" onClick={() => setImage(null)}>❌ 삭제</button>
                </div>
              ) : (
                <p className="community-drop-hint">📥 이미지를 여기에 드래그하거나 클릭하여 업로드</p>
              )}
            </div>

            <input
              id="hiddenFileInput"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => setImage(e.target.files[0])}
            />

            <textarea
              rows="5"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              required
            />

            {uploading && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <div className="progress-text">
                  {uploadProgress < 100 ? '업로드 중...' : '완료!'}
                </div>
              </div>
            )}
            
            <div className="community-form-buttons">
              <button type="submit" disabled={uploading}>
                {uploading ? '업로드 중...' : '작성'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} disabled={uploading}>
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      <h2 className="community-subtitle">게시글 목록</h2>

      {loading && (
        <AnimatedLoadingSpinner message="데이터를 불러오는 중..." />
      )}

      {error && (
        <div className='error-message'>
          {error}
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className='no-posts-message'>
          아직 등록된 게시글이 없습니다.
        </div>
      )}

      {!loading && !error && posts.map((post) => (
        <div className='community-post' key={post._id}>
          <div className='post-header'>
            <div className='post-author-info'>
              <span className='post-author'>👤 {post.user_name || '알 수 없음'}</span>
              <span className='post-category'>{post.category}</span>
            </div>
            <span className='post-date'>{new Date(post.created_at).toLocaleString()}</span>
          </div>
          <div className='post-title'><b>{post.title}</b></div>
          <div className='post-content'>{post.content}</div>
          {post.image_url && <img src={post.image_url} width="200" alt="post" className='post-image' />}
          
          <div className='post-stats'>
            <span>👍 {post.likes || 0}</span>
            <span>💬 {post.comment_count || 0}</span>
          </div>
          
          <div className='post-actions'>
            {isAuthenticated && (
              <button className='post-like-button' onClick={() => handleLike(post._id)}>
                👍 좋아요
              </button>
            )}
            <button className='post-comment-button' onClick={() => openPostDetail(post)}>
              💬 댓글보기
            </button>
            
            {isAuthor(post) && (
              <>
                <button 
                  className='post-delete-button' 
                  onClick={() => handleDelete(post._id)}
                  disabled={deletingIds.has(post._id)}
                >
                  {deletingIds.has(post._id) ? '삭제 중...' : '삭제'}
                </button>
                <button className='post-edit-button' onClick={() => {
                  setShowEditForm(post._id);
                  setTitle(post.title);
                  setContent(post.content);
                  setCategory(post.category);
                  setImage(null);
                }}>
                  수정
                </button>
              </>
            )}
          </div>

          {showEditForm === post._id && (
            <form className='post-edit-form' onSubmit={(e) => handleEdit(e, post._id)}>
              <input 
                className='post-edit-input' 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="제목 수정" 
                required 
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input 
                className='post-edit-input' 
                type="file" 
                accept="image/*" 
                onChange={(e) => setImage(e.target.files[0])} 
              />
              <textarea 
                className='post-edit-textarea' 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                required 
              />
              <button className='post-edit-save-button' type="submit">저장</button>
              <button 
                className='post-edit-cancel-button' 
                type="button" 
                onClick={() => setShowEditForm(null)}
              >
                취소
              </button>
            </form>
          )}
        </div>
      ))}

      <div className='pagination'>
        <button 
          className='pagination-button' 
          disabled={page === 1} 
          onClick={() => setPage(page - 1)}
        >
          이전
        </button>
        <span className='pagination-info'>{page} / {totalPages}</span>
        <button 
          className='pagination-button' 
          disabled={page === totalPages} 
          onClick={() => setPage(page + 1)}
        >
          다음
        </button>
      </div>

      {/* 게시글 상세 모달 */}
      {selectedPost && (
        <div className='post-detail-modal'>
          <div className='modal-content'>
            <button className='modal-close-button' onClick={closePostDetail}>X</button>
            
            <div className='modal-post'>
              <div className='modal-post-header'>
                <div className='modal-post-author-info'>
                  <span className='modal-post-author'>👤 {selectedPost.user_name || '알 수 없음'}</span>
                  <span className='modal-post-category'>{selectedPost.category}</span>
                </div>
                <span className='modal-post-date'>{new Date(selectedPost.created_at).toLocaleString()}</span>
              </div>
              <h3 className='modal-post-title'>{selectedPost.title}</h3>
              <div className='modal-post-content'>{selectedPost.content}</div>
              {selectedPost.image_url && (
                <img src={selectedPost.image_url} alt="post" className='modal-post-image' />
              )}
            </div>

            <div className='modal-comments'>
              <h4>댓글 ({selectedPost.comment_count || 0})</h4>
              
              {isAuthenticated ? (
                <form onSubmit={(e) => handleCommentSubmit(e, selectedPost._id)} className='comment-form'>
                  <textarea
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="댓글을 입력하세요..."
                    required
                  />
                  <button type="submit">댓글 작성</button>
                </form>
              ) : (
                <div className='login-prompt'>
                  <p>댓글을 작성하려면 로그인이 필요합니다.</p>
                  <button onClick={() => navigate('/login')} className='login-button'>
                    로그인하기
                  </button>
                </div>
              )}

              <div className='comments-list'>
                {comments.map((comment) => (
                  <div key={comment._id} className='comment-item'>
                    <div className='comment-header'>
                      <span className='comment-author'>👤 {comment.user_name || '알 수 없음'}</span>
                      <span className='comment-date'>{new Date(comment.created_at).toLocaleString()}</span>
                    </div>
                    <div className='comment-content'>{comment.content}</div>
                    <div className='comment-info'>
                      <span className='comment-likes'>👍 {comment.likes || 0}</span>
                    </div>
                    <div className='comment-actions'>
                      {isAuthenticated && (
                        <button onClick={() => handleCommentLike(comment._id)}>👍</button>
                      )}
                      {isCommentAuthor(comment) && (
                        <button onClick={() => handleCommentDelete(comment._id, selectedPost._id)}>
                          삭제
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {commentTotalPages > 1 && (
                <div className='comment-pagination'>
                  <button 
                    disabled={commentPage === 1} 
                    onClick={() => fetchComments(selectedPost._id, commentPage - 1)}
                  >
                    이전
                  </button>
                  <span>{commentPage} / {commentTotalPages}</span>
                  <button 
                    disabled={commentPage === commentTotalPages} 
                    onClick={() => fetchComments(selectedPost._id, commentPage + 1)}
                  >
                    다음
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
} 
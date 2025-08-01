// API 클라이언트 유틸리티 - 타임아웃과 재시도 로직 포함
import { API_ENDPOINTS } from '../config/api';
import { authHeaders } from './auth';

class ApiClient {
  constructor() {
    this.timeout = 60000; // 60초 타임아웃
    
    // 기본 API URL 추출 (REPORTS 엔드포인트에서 /api 부분 제거)
    this.baseUrl = API_ENDPOINTS.REPORTS.replace('/api/reports', '');
  }

  // 인증 토큰 설정
  setAuthToken(token) {
    this.token = token;
  }

  // 타임아웃을 포함한 fetch 래퍼
  async fetchWithTimeout(url, options = {}, timeout = this.timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // 단순 API 호출 (재시도 로직 제거)
  async requestWithRetry(url, options = {}) {
    // URL이 상대 경로인 경우 기본 API URL과 결합
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;

    // 인증 헤더 자동 추가
    const headers = {
      ...authHeaders(),
      ...options.headers
    };

    try {
      console.log(`API 요청: ${fullUrl}`);
      
      const response = await this.fetchWithTimeout(fullUrl, {
        ...options,
        headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API 요청 실패:`, error.message);
      throw error;
    }
  }


async saveAnalysisResult(result, imageFile) {
  const formData = new FormData();
  formData.append('analysisResult', JSON.stringify(result));
  if (imageFile) formData.append('image', imageFile);

  const token = localStorage.getItem('authToken'); // 로그인 인증 토큰 사용

  const res = await fetch('/api/analysis-result', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}` // 토큰이 필요하다면
    },
    body: formData
  });

  if (!res.ok) throw new Error('저장 실패');
  return res.json();
}

  // 이미지 분석 API 호출
  async analyzeImage(formData, onProgress = null) {
    const url = API_ENDPOINTS.ANALYZE;
    
    // 요청 취소를 위한 AbortController 생성
    const controller = new AbortController();
    
    try {
      // 진행 상황 콜백이 있으면 호출
      if (onProgress) {
        onProgress('서버에 이미지를 전송하고 있습니다...');
      }

      const result = await this.requestWithRetry(url, {
        method: 'POST',
        body: formData,
        signal: controller.signal, // 취소 신호 추가
      });

      if (onProgress) {
        onProgress('분석이 완료되었습니다!');
      }

      return result;
    } catch (error) {
      // 요청이 취소된 경우
      if (error.name === 'AbortError') {
        console.log('이미지 분석 요청이 취소되었습니다.');
        throw new Error('분석 요청이 취소되었습니다.');
      }
      
      console.error('이미지 분석 실패:', error);
      throw error;
    }
  }

  // 개선된 이미지 분석 API 호출 (객체/라벨 포함)
  async analyzeImageComprehensive(formData, onProgress = null) {
    const url = API_ENDPOINTS.ANALYZE_COMPREHENSIVE;
    
    try {
      // 진행 상황 콜백이 있으면 호출
      if (onProgress) {
        onProgress('서버에 이미지를 전송하고 있습니다... (개선된 분석)');
      }

      const result = await this.requestWithRetry(url, {
        method: 'POST',
        body: formData,
      });

      if (onProgress) {
        onProgress('개선된 분석이 완료되었습니다!');
      }

      return result;
    } catch (error) {
      console.error('개선된 이미지 분석 실패:', error);
      throw error;
    }
  }

  // 분석 결과 저장
  async saveAnalysisResult(analysisResult, imageFile = null) {
    const url = '/api/analysis-result/save';
    
    try {
      const formData = new FormData();
      
      // 분석 결과 데이터 추가
      formData.append('analysisResult', JSON.stringify(analysisResult));
      
      // 이미지 파일이 있으면 추가
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const result = await this.requestWithRetry(url, {
        method: 'POST',
        body: formData,
      });

      return result;
    } catch (error) {
      console.error('분석 결과 저장 실패:', error);
      throw error;
    }
  }

  // 사용자의 분석 결과 목록 조회
  async getUserAnalysisResults(page = 1, limit = 10) {
    const url = `/api/analysis-result/user?page=${page}&limit=${limit}`;
    
    try {
      const result = await this.requestWithRetry(url);
      return result;
    } catch (error) {
      console.error('분석 결과 조회 실패:', error);
      throw error;
    }
  }

  // 특정 분석 결과 조회
  async getAnalysisResult(id) {
    const url = `/api/analysis-result/${id}`;
    
    try {
      const result = await this.requestWithRetry(url);
      return result;
    } catch (error) {
      console.error('분석 결과 조회 실패:', error);
      throw error;
    }
  }

  // 분석 결과 삭제
  async deleteAnalysisResult(id) {
    const url = `/api/analysis-result/${id}`;
    
    try {
      const result = await this.requestWithRetry(url, {
        method: 'DELETE',
      });
      return result;
    } catch (error) {
      console.error('분석 결과 삭제 실패:', error);
      throw error;
    }
  }

  // 신고 목록 가져오기
  async getReports() {
    const url = API_ENDPOINTS.REPORTS;
    return await this.requestWithRetry(url);
  }

  // 신고 좋아요
  async likeReport(id) {
    const url = API_ENDPOINTS.REPORT_LIKE(id);
    return await this.requestWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // 신고 생성
  async createReport(reportData) {
    const url = API_ENDPOINTS.REPORTS;
    return await this.requestWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData),
    });
  }

  // 타임아웃 설정 변경
  setTimeout(timeout) {
    this.timeout = timeout;
  }
}

// 싱글톤 인스턴스 생성
const apiClient = new ApiClient();

export default apiClient; 
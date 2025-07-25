// API 클라이언트 유틸리티 - 타임아웃과 재시도 로직 포함
import { API_ENDPOINTS } from '../config/api';

class ApiClient {
  constructor() {
    this.timeout = 60000; // 60초 타임아웃 (더 긴 응답 시간 허용)
    this.maxRetries = 3; // 최대 3번 재시도
    this.retryDelay = 3000; // 재시도 간격 3초 (더 긴 간격)
    
    // 기본 API URL 추출 (REPORTS 엔드포인트에서 /api 부분 제거)
    this.baseUrl = API_ENDPOINTS.REPORTS.replace('/api/reports', '');
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

  // 재시도 로직이 포함된 API 호출
  async requestWithRetry(url, options = {}, retries = this.maxRetries) {
    let lastError;

    // URL이 상대 경로인 경우 기본 API URL과 결합
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`API 요청 시도 ${attempt}/${retries}: ${fullUrl}`);
        
        const response = await this.fetchWithTimeout(fullUrl, options);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        lastError = error;
        console.warn(`API 요청 실패 (시도 ${attempt}/${retries}):`, error.message);
        
        // 마지막 시도가 아니면 재시도
        if (attempt < retries) {
          console.log(`${this.retryDelay}ms 후 재시도합니다...`);
          await this.delay(this.retryDelay);
        }
      }
    }
    
    throw new Error(`API 요청 실패 (${retries}번 시도 후): ${lastError.message}`);
  }

  // 지연 함수
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 이미지 분석 API 호출
  async analyzeImage(formData, onProgress = null) {
    const url = API_ENDPOINTS.ANALYZE;
    
    try {
      // 진행 상황 콜백이 있으면 호출
      if (onProgress) {
        onProgress('서버에 이미지를 전송하고 있습니다...');
      }

      const result = await this.requestWithRetry(url, {
        method: 'POST',
        body: formData,
      });

      if (onProgress) {
        onProgress('분석이 완료되었습니다!');
      }

      return result;
    } catch (error) {
      console.error('이미지 분석 실패:', error);
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

  // 재시도 횟수 설정 변경
  setMaxRetries(maxRetries) {
    this.maxRetries = maxRetries;
  }

  // 재시도 간격 설정 변경
  setRetryDelay(retryDelay) {
    this.retryDelay = retryDelay;
  }
}

// 싱글톤 인스턴스 생성
const apiClient = new ApiClient();

export default apiClient; 
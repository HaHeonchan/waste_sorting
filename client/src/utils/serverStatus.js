// 서버 상태 확인 유틸리티
import apiClient from './apiClient';

class ServerStatus {
  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  }

  // 서버 상태 확인
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('서버 상태 확인 실패:', error);
      throw error;
    }
  }

  // 환경변수 확인
  async checkEnvironment() {
    try {
      const response = await fetch(`${this.baseUrl}/api/debug/env`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('환경변수 확인 실패:', error);
      throw error;
    }
  }

  // 서버 연결 테스트
  async testConnection() {
    const startTime = Date.now();
    
    try {
      const health = await this.checkHealth();
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      return {
        status: 'success',
        responseTime,
        data: health,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      return {
        status: 'error',
        responseTime,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // 상세 진단
  async runDiagnostics() {
    console.log('🔍 서버 진단 시작...');
    
    const results = {
      connection: null,
      environment: null,
      timestamp: new Date().toISOString()
    };

    try {
      // 1. 연결 테스트
      console.log('1️⃣ 서버 연결 테스트...');
      results.connection = await this.testConnection();
      
      // 2. 환경변수 확인
      console.log('2️⃣ 환경변수 확인...');
      results.environment = await this.checkEnvironment();
      
      console.log('✅ 진단 완료:', results);
      return results;
    } catch (error) {
      console.error('❌ 진단 실패:', error);
      results.error = error.message;
      return results;
    }
  }
}

// 싱글톤 인스턴스 생성
const serverStatus = new ServerStatus();

export default serverStatus; 
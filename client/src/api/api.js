 const API_BASE_URL = 'http://localhost:8000/api/v1';
const BEARER_TOKEN = 'af215d20c2561423c20b7ccdfbb4dbc6fe7c5bb9bc869dae38917c8de16368ca';

class ApiClient {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.token}`,
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.detail || `HTTP ${response.status}: ${response.statusText}`;
        } catch {
          errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  async analyzeDocuments(data) {
    return this.makeRequest('/hackrx/run', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

const apiClient = new ApiClient(API_BASE_URL, BEARER_TOKEN);

export default apiClient;
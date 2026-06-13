window.API = {
  BASE_URL: '/api',

  getToken() {
    return localStorage.getItem('edu_crm_token');
  },
  
  setToken(token) {
    localStorage.setItem('edu_crm_token', token);
  },
  
  removeToken() {
    localStorage.removeItem('edu_crm_token');
  },

  async request(method, endpoint, body = null) {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method,
      headers
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${this.BASE_URL}${endpoint}`, config);
      const data = await response.json();
      
      if (response.status === 401 || response.status === 403) {
        this.removeToken();
        window.location.hash = '#login';
        throw new Error(data.error || 'Autentifikatsiya xatosi');
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Server xatosi');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  get(endpoint) { return this.request('GET', endpoint); },
  post(endpoint, body) { return this.request('POST', endpoint, body); },
  put(endpoint, body) { return this.request('PUT', endpoint, body); },
  del(endpoint) { return this.request('DELETE', endpoint); }
};

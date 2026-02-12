import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '../main';
import { message } from 'ant-design-vue';

export const useUserStore = defineStore('user', () => {
  const user = ref(null);
  const loading = ref(false);
  const loadingAuth = ref(false);
  const checkAuthHadRun = ref(false);
  const error = ref(null);
  const subscriptions = ref([]);


  const userInitials = computed(() => {
    if (!user.value?.name) return 'U';
    return user.value.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  });


  const isAuthenticated = computed(() => !!user.value);

  // Set auth tokens in axios headers and localStorage
  const setAuthTokens = (access, refresh) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
  };

  // Clear auth tokens
  const clearAuth = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    delete api.defaults.headers.common['Authorization'];
    user.value = null;
    window.location.reload();

  };

  const fetch_subscriptions = async () => {
    try {
      const response = await api.get('transaction/transactions/my_subscriptions/');
      subscriptions.value = response.data;
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      return null;
    }
  };
  const check_monthly_free_connects = async () => {
    try {
      const response = await api.get('transaction/transactions/check_monthly_free_connects/');
      console.log("monthly connects status:", response.data.message)
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };
  // Check if user is authenticated on app load
  const checkAuth = async () => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) return false;

    try {
      loadingAuth.value = true;
      if (!checkAuthHadRun.value) checkAuthHadRun.value = true;
      const response = await api.get('account/users/me/');
      user.value = response.data;
      await fetch_subscriptions();
      await check_monthly_free_connects();
      return true;
    } catch (error) {
      clearAuth();
      return false;
    } finally {
      loadingAuth.value = false;
    }
  };

  // Login user
  const login = async (email, password) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.post('account/login/', { email, password });
      const { access, refresh } = response.data;
      setAuthTokens(access, refresh);
      
      // Get user data
      const userResponse = await api.get('account/users/me/');
      user.value = userResponse.data;
      
      return { success: true };
    } catch (err) {
      // Handle specific field errors from the server
      if (err.response?.data) {
        const fieldErrors = {};
        // Handle field errors (email, password, etc.)
        Object.entries(err.response.data).forEach(([field, messages]) => {
          if (Array.isArray(messages)) {
            fieldErrors[field] = messages;
          }
        });
        
        // If we have field errors, use them, otherwise use the detail or default message
        if (Object.keys(fieldErrors).length > 0) {
          error.value = fieldErrors;
        } else {
          error.value = { general: [err.response.data.detail || 'Login failed'] };
        }
      } else {
        error.value = { general: ['An unknown error occurred'] };
      }
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  // Logout user
  const logout = (router) => {
    try {
      clearAuth();
      message.success('Successfully logged out');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      message.error('Failed to logout. Please try again.');
    }
  }

  // Register new user
  const register = async (userData) => {
    loading.value = true;
    error.value = null;
    
    try {
      await api.post('account/users/', userData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return { success: true, email: userData.email };
    } catch (err) {
      error.value = err.response?.data || 'Registration failed';
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  // Verify email with OTP
  const verifyEmail = async (email, otp) => {
    try {
      await api.post('account/users/verify_email/', { email, otp });
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.error || 'Verification failed' 
      };
    }
  };

  // Resend OTP
  const resendOtp = async (email) => {
    try {
      await api.post('account/users/resend_otp/', { email });
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.error || 'Failed to resend OTP' 
      };
    }
  };
  const sendOtp = async (email) => {
    await api.post('/account/users/send_reset_otp/', {
      email: email
    });
  }
  const sendResendOtp = async (email) => {
    await api.post('/account/users/send_reset_otp/', {
      email: email
    });
  }

  const verifyOtp = async (email, otp) => {
    const response = await api.post('/account/users/verify_reset_otp/', {
      email: email,
      otp: otp
    });
    return response;
  }

  const updatePassword = async (password1, password2, token) => {
    await api.post(
      '/account/users/reset_password/',
      {
        password1: password1,
        password2: password2
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    register,
    verifyEmail,
    resendOtp,
    checkAuth,
    loadingAuth,
    checkAuthHadRun,
    subscriptions,
    userInitials,
    sendOtp,
    sendResendOtp,
    verifyOtp,
    updatePassword
  };
});

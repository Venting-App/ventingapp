import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/stores/user';
import LandingPage from '@/views/LandingPage.vue';
import AuthPage from '@/views/auth/AuthPage.vue';
import Feed from '@/views/Feed.vue';
import NewPost from '@/views/NewPost.vue';
import ForgotPassword from '@/views/auth/ForgotPassword.vue';
import Profile from '@/views/MyProfile.vue';
import OtherProfile from '@/views/OtherProfile.vue';
import ManualPayment from '@/views/ManualPayment.vue';
import AdminLayout from '@/layouts/AdminLayout.vue';
import AdminDashboard from '@/views/admin/DashboardView.vue';
import HistoryView from '@/views/HistoryView.vue';
import ChatView from '@/views/ChatView.vue';
import ChatDetail from '@/views/ChatDetail.vue';
import { FEED_PATH } from '@/constants';
const routes = [
  {
    path: '/',
    name: 'Home',
    component: LandingPage,
    meta: { requiresAuth: false }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile/:userId',
    name: 'OtherProfile',
    component: OtherProfile,
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/@:username',
    name: 'UsernameProfile',
    component: OtherProfile,
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/history',
    name: 'History',
    component: HistoryView,
    meta: { requiresAuth: true }
  },
  {
    path: '/chat',
    name: 'Chat',
    component: ChatView,
    meta: { requiresAuth: true }
  },
  {
    path: '/chat/:id',
    name: 'ChatDetail',
    component: ChatDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: AuthPage,
    meta: { requiresAuth: false }
  },
  {
    path: '/signup',
    name: 'Signup',
    component: AuthPage,
    meta: { requiresAuth: false }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPassword,
    meta: { requiresAuth: false }
  },
  {
    path: FEED_PATH,
    name: 'Feed',
    component: Feed,
    meta: { requiresAuth: true }
  },
  {
    path: '/new-post',
    name: 'NewPost',
    component: NewPost,
    meta: { requiresAuth: true }
  },
  {
    path: '/manual-payment',
    name: 'ManualPayment',
    component: ManualPayment,
    meta: { requiresAuth: true }
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: () => import('@/views/NotificationsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/success',
    name: 'Success',
    beforeEnter: () => {
      // Reload the page (forces full SPA reload)
      console.log("redirecting")
      window.location.reload();
      window.location.href = `/home?_v=${Date.now()}`;
    }  
  },
  {
    path: '/emoji',
    name: 'Emoji',
    component: () => import('@/components/emoji.vue'),
    meta: { requiresAuth: true }
  },
  // Admin routes
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, requiresStaff: true },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: AdminDashboard,
        meta: { title: 'Dashboard' }
      },
      {
        path: 'payments',
        name: 'AdminPayments',
        component: () => import('@/views/admin/PaymentsView.vue'),
        meta: { title: 'Pending Payments' }
      },
      {
        path: 'reports/:type?',
        name: 'AdminReports',
        component: () => import('@/views/admin/ReportsView.vue'),
        meta: { title: 'Reports' }
      },
      // In router/index.js, add this to the admin children array
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/UsersView.vue'),
        meta: { title: 'Users' }
      }
      // Add more admin routes here as needed
    ]
  },
  // Add a catch-all route for 404s
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    // Always scroll to top when navigating to a new route
    return { top: 0 };
  },
});

// Navigation guard to check authentication and permissions
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();
  // Check if we need to verify authentication state
  if (
    userStore.checkAuthHadRun && 
    !userStore.loadingAuth && 
    !userStore.user && 
    localStorage.getItem('access_token')
  ) {
    try {
      // Try to refresh the user data if we have a token
      await userStore.checkAuth();
    } catch (error) {
      // If refresh fails, clear auth and redirect to login
      userStore.clearAuth();
      if (to.meta.requiresAuth) {
        next({ name: 'Login', query: { redirect: to.fullPath } });
        return;
      }
    }
  }
  
  // Check if the route requires authentication
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // Check if user is not authenticated
    if (
      userStore.checkAuthHadRun && 
      !userStore.loadingAuth &&
      !userStore.isAuthenticated
    ) {
      next({ name: 'Login', query: { redirect: to.fullPath } });
      return;
    }
    
    // Check if the route requires staff access
    if (to.matched.some(record => record.meta.requiresStaff)) {
      if (!userStore.user?.is_staff) {
        // Redirect to home if not staff
        next({ name: 'Feed' });
        return;
      }
    }
    
    next();
  } else {
    next();
  }
});

export default router;

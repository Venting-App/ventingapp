<script setup>
import { RouterView, useRoute } from 'vue-router';
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import SupportModal from '@/components/common/SupportModal.vue';

import CelebrationModal from '@/components/transaction/CelebrationModal.vue';
import { useUserStore } from '@/stores/user';
import { useSupportStore } from '@/stores/support';
import { useTransactionStore } from '@/stores/transaction';
const route = useRoute();
const showCelebration = ref(false);
const recentTransaction = ref(null);
const userStore = useUserStore();
const supportStore = useSupportStore();
const transactionStore = useTransactionStore();
const checkForSuccess = async () => {
  if(!userStore.isAuthenticated) return;
  console.log("checking for success")
    try {
      const response = await transactionStore.getRecentSuccess();
      console.log("recent success", response.data)
      if (response.data && response.data.connects) {
        recentTransaction.value = response.data;
        showCelebration.value = true;
        userStore.checkAuth();
      }
    } catch (error) {
      console.error('Error fetching recent transaction:', error);
    }
};

// Check when route changes
watch(() => route.query, () => {
  userStore.checkAuth();
  console.log("waiting a second... before checking success")
  setTimeout(() => {
    checkForSuccess();
  }, 1000);
});

window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    window.location.reload(); // forces full reload
  }
});

const handleVisibilityChange = () => {
  if (!document.hidden) {
    // User has returned to the tab
    console.log('User returned to the page!');
    setTimeout(() => {
      checkForSuccess();
    }, 1000);
  }
};

onMounted(async () => {
  const splash = document.getElementById('splash')
  await userStore.checkAuth();

  document.addEventListener('visibilitychange', handleVisibilityChange);
  if (splash) splash.classList.add('fade-out')
  setTimeout(() => {
    checkForSuccess();
  }, 1000);
});

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Global notification container -->
    <div id="notification-container"></div>
    
    <!-- Main content -->
    <main class="min-h-screen">
      <RouterView v-slot="{ Component }">
        <transition 
          enter-active-class="transition-opacity duration-200 ease-out"
          leave-active-class="transition-opacity duration-150 ease-in"
          enter-from-class="opacity-0"
          leave-to-class="opacity-0"
        >
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>

    <!-- Celebration Modal -->
    <CelebrationModal 
      :is-open="showCelebration" 
      :transaction="recentTransaction"
      @close="showCelebration = false"
    />
    <!-- Support Contacts Modal -->
    <SupportModal 
      v-if="supportStore.isOpen"
      :is-open="supportStore.isOpen"
      @close="supportStore.close"
    />
  </div>
</template>


<template>
  <div class="min-h-screen bg-zinc-50/50 font-sans">
    <DesktopTopNav />    
    <MobileTopNav />
    
    <!-- Main Content -->
    <div class="pt-20 pb-20 md:pt-6 md:pb-0 relative z-0">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <!-- Loading State -->
        <div v-if="profileStore.loading" class="text-center py-20 flex flex-col items-center">
          <div class="animate-spin rounded-full h-10 w-10 border-[3px] border-violet-100 border-t-violet-500 mb-4"></div>
          <p class="text-sm font-medium text-zinc-400 animate-pulse tracking-wide">Finding profile...</p>
        </div>

        <!-- Profile Content -->
        <div v-else class="flex flex-col md:flex-row gap-8">
          <!-- Left Column - User Profile -->
          <OtherProfileDetail 
            :post-count="profileStore.postCount"
            :profile="profileStore.profile"
            @follow="handleProfileFollowClick"
          />
          
          <!-- Right Column - User Posts -->
          <div class="w-full md:w-2/3">
            <div class="bg-white shadow-sm border border-zinc-100 rounded-2xl overflow-hidden min-h-[500px]">
                <div class="px-6 py-4 border-b border-zinc-100 bg-zinc-50/30 flex items-center gap-2">
                    <FileText class="w-4 h-4 text-violet-500" />
                    <h3 class="text-sm font-bold text-zinc-900 uppercase tracking-wide">Stories & Posts</h3>
                </div>
                <FeedList :user_id="profileStore.profileId" />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <MobileBottomNav />
    <ConnectionModal 
      v-if="showConnectionsModal" 
      @close="showConnectionsModal = false" 
      :show="showConnectionsModal" 
      :connections="connections"
      :post_id="profileStore.selectedPost?.id"
      :loadingConnections="loadingConnections"
    />
    <ConnectionRequestModal
      v-if="profileStore.showConnectionProfileModal"
      :is-open="profileStore.showConnectionProfileModal"
      :user-name="profileStore.selectedUserForConnection?.posted_by?.name || 'this user'"
      @close="profileStore.closeConnectionProfileModal"
      @confirm="profileStore.confirmConnectionRequest"
    />
    
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { useOtherProfilePostStore } from '@/stores/profile';
import DesktopTopNav from '@/components/layout/DesktopTopNav.vue';
import MobileTopNav from '@/components/layout/MobileTopNav.vue';
import MobileBottomNav from '@/components/layout/MobileBottomNav.vue';
import FeedList from '@/components/feed/FeedList.vue';
import ConnectionModal from '@/components/feed/ConnectionsModal.vue';
import ConnectionRequestModal from '@/components/feed/ConnectionRequestModal.vue';
import OtherProfileDetail from '@/components/other_profile/OtherProfileDetail.vue';
import { useConnectionStore } from '@/stores/connection';
import { FileText } from 'lucide-vue-next';

const route = useRoute();
const userStore = useUserStore();
const profileStore = useOtherProfilePostStore();
const connectionStore = useConnectionStore();
const showConnectionsModal = ref(false);

const connections = ref([]);

const loadingConnections = ref(false);

const fetchConnections = async () => {  
  try {
    loadingConnections.value = true;
    const response = await connectionStore.fetchOurConnections(profileStore.profileId);
    connections.value = response.data;
    showConnectionsModal.value = true;
  } catch (error) {
    console.error('Error fetching connections:', error);
  } finally {
    loadingConnections.value = false;
  }
};

const handleProfileFollowClick = async () => {
  console.log("clicked follow")
  if (profileStore.profile.pending_connection) {
    fetchConnections();
  } else if (!profileStore.profile.rejected_connection) {
    if (profileStore.profile.removed_connection && !profileStore.profile.pending_connection && !profileStore.profile.rejected_connection) {
        profileStore.setShowConnectionProfileModal(true);
    } else {
        await profileStore.handleProfileFollow(false);
        await userStore.checkAuth();
    }
  }
};

const loadProfile = async () => {
  console.log("user id", route.params.userId)
  console.log("username", route.params.username)
  profileStore.resetProfileId();
  if (route.params.userId || route.params.username) {
      profileStore.setLoading(true);
      await profileStore.fetchUserProfile(route);
      profileStore.setLoading(false);
  } else {
      profileStore.setLoading(false);
  }
  profileStore.startProfilePolling(route);

}
watch(() => route.params.userId, async (newUserId, oldUserId) => {
  if (newUserId && newUserId !== oldUserId) {
    await loadProfile();
  }
});

// Initial load
onMounted(async () => {
    await loadProfile();
});

onUnmounted(() => {
    profileStore.stopProfilePolling();
});
</script>

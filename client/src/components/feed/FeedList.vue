<template>
  <div>
    <main :class="[ user_id == null && 'pb-24 md:pt-0 md:pb-0', user_id == null && postStore.searchProfileResults.length == 0 && 'pt-16 md:pt-6']">
      <div class="max-w-xl mx-auto px-0 sm:px-4 py-6">
        <!-- Posts Feed -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-20 space-y-4">
          <div class="animate-spin rounded-full h-8 w-8 border-[3px] border-violet-100 border-t-violet-500"></div>
          <span class="text-sm font-medium text-zinc-400 animate-pulse tracking-wide">Listening for voices...</span>
        </div>
        
        <div v-else-if="posts.length === 0" class="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div class="bg-zinc-100 rounded-full p-6 mb-4">
                <svg class="w-10 h-10 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            </div>
            <p class="text-zinc-500 font-medium text-lg">{{ noPostPlaceholder }}</p>
            <p class="text-zinc-400 text-sm mt-2">Be the first to share your story.</p>
        </div>
        
        <div v-else class="space-y-6" id="post-list">
            <div v-if="postStore.isInSearch" class="px-4 sm:px-0 mb-6">
                <h2 class="text-lg font-medium text-zinc-800 tracking-tight flex items-center gap-2">
                    Finding results for
                    <span v-if="postStore.searchQuery" class="text-violet-600 bg-violet-50 px-3 py-0.5 rounded-full font-semibold">"{{ postStore.searchQuery }}"</span>
                </h2>
            </div>
                      
            <FeedItem
                v-for="post in posts"
                :key="post.id"
                :post="post"
                :data-id="`post-${post.id}`"
                :liking="likingPostId === post.id"
                :saving="savingPostId === post.id"
                :is-current-user-post="getIsCurrentUserPost(post)"
                :processing-donation="processingDonation"
                @donate-click="handleDonate(post)"
                @chat-click="handleChat(post)"
                @save-click="handleSave(post)"
                @like-click="handleLike(post)"
                @follow-click="handleFollowClick(post)"
                @comment-click="handleCommentClick(post)"
                @share-click="handleShareClick(post)"
            />
          
            <!-- Load More Button -->
            <div v-if="hasNextPage || postStore.showRecommended" class="flex justify-center py-10 pb-16">
                <button 
                    @click="loadMore" 
                    :disabled="loadingMore"
                    class="cursor-pointer group relative px-8 py-3 bg-white border border-zinc-200 text-zinc-600 font-medium rounded-full shadow-sm hover:shadow hover:border-violet-200 hover:text-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    <span class="flex items-center gap-2.5">
                        <span v-if="loadingMore" class="animate-spin h-4 w-4 border-2 border-violet-500 border-t-transparent rounded-full"></span>
                        <span class="tracking-wide text-sm">{{ loadingMore ? 'Loading stories...' : 'Read More Stories' }}</span>
                    </span>
                </button>
          </div>
        </div>
      </div>
    </main>
    
    <CommentModal 
      v-if="showCommentModal"
      :post="selectedPost"
      :show="showCommentModal"
      :user_id="user_id"
      :is-current-user-post="getIsCurrentUserPost(selectedPost)"
      :processing-donation="processingDonation"
      @like="handleLike(selectedPost)"
      @save="handleSave(selectedPost)"
      @share="handleShareClick(selectedPost)"
      @close="closeCommentModal"
      @update:post="handleUpdatePostObj(selectedPost)"
      @follow-click="handleFollowClick(selectedPost)"
      @chat-click="handleChat(selectedPost)"
      @donate-click="handleDonate(selectedPost)"
    />

    <FeedModals
        v-if="!showCommentModal"
        :user_id="user_id"
        @follow-click="handleFollowClick"
    />

  </div>
</template>

<script setup>
import { onMounted, computed, watch, onUnmounted, nextTick } from 'vue';
import { useUserStore } from '@/stores/user';
import FeedItem from '@/components/feed/FeedItem.vue';
import CommentModal from '@/components/feed/CommentModal.vue';
import FeedModals from '@/components/feed/FeedModals.vue';
import { useConnectionStore } from '@/stores/connection';
import { useConnectsStore } from '@/stores/connect';
import { usePostStore } from '@/stores/post';
import { useOtherProfilePostStore } from '@/stores/profile';
import { useRouter, useRoute } from 'vue-router';
const connectionStore = useConnectionStore();
const connectsStore = useConnectsStore();
const userStore = useUserStore();
const postStore = usePostStore();
const profileStore = useOtherProfilePostStore();
const router = useRouter();
const route = useRoute();
const props = defineProps({
    user_id: {
        type: [String, Number],
        required: false
    }
})

const getIsCurrentUserPost = (post) => {
  return userStore.user && post.posted_by && userStore.user.id === post.posted_by.id;
};

const handleCommentClick = (post) => {
    if (props.user_id == null) {
        postStore.openCommentModal(post);
    } else {
        profileStore.openCommentModal(post);
    }
};

const closeCommentModal = () => {
    if (props.user_id == null) {
        postStore.closeCommentModal();
    } else {
        profileStore.closeCommentModal();
    }
};

const loading = computed(() => props.user_id == null ? postStore.loading : profileStore.loading)
const posts = computed(() => {
    if (props.user_id == null) {
        if (postStore.isInSearch) {
            return postStore.searchPostResults
        }
        return postStore.posts
    }
    return profileStore.posts
})
const noPostPlaceholder = computed(() => {
    if (props.user_id == null) {
        return postStore.isInSearch
            ? "No posts match your search."
            : "No posts yet. Start the conversation!"
    }
    return "This user hasn't posted anything yet."
});

const likingPostId = computed(() => props.user_id == null ? postStore.likingPostId : profileStore.likingPostId)
const savingPostId = computed(() => props.user_id == null ? postStore.savingPostId : profileStore.savingPostId)
const hasNextPage = computed(() => props.user_id == null ? postStore.hasNextPage : profileStore.hasNextPage)
const loadingMore = computed(() => props.user_id == null ? postStore.loadingMore : profileStore.loadingMore)
const selectedPost = computed(() => props.user_id == null ? postStore.selectedPost : profileStore.selectedPost)
const showCommentModal = computed(() => props.user_id == null ? postStore.showCommentModal : profileStore.showCommentModal)
const processingDonation = computed(() => props.user_id == null ? postStore.processingDonation : profileStore.processingDonation);

const loadMore = () => {
    if (props.user_id == null) {
        postStore.loadMore();
    } else {
        profileStore.loadMore();
    }
}
const openDonationModal = (post) => {
    if (props.user_id == null) {
        postStore.openDonationModal(post);
    } else {
        profileStore.openDonationModal(post);
    }
}

const openConnectionsModal = (post) => {
    if (props.user_id == null) {
        postStore.openConnectionsModal(post);
    } else {
        profileStore.openConnectionsModal(post);
    }
}

const openShareModal = (post) => {
    if (props.user_id == null) {
        postStore.openShareModal(post);
    } else {
        profileStore.openShareModal(post);
    }
}

const setConnections = (value) => {
    if (props.user_id == null) {
        postStore.setConnections(value);
    } else {
        profileStore.setConnections(value);
    }
}

const setConnectionPromptPurpose = (value) => {
    if (props.user_id == null) {
        postStore.setConnectionPromptPurpose(value);
    } else {
        profileStore.setConnectionPromptPurpose(value);
    }
}
const setLoadingConnections = (value) => {
    if (props.user_id == null) {
        postStore.setLoadingConnections(value);
    } else {
        profileStore.setLoadingConnections(value);
    }
}

const openConnectionPrompt = (post) => {
    if (props.user_id == null) {
        postStore.openConnectionPrompt(post);
    } else {
        profileStore.openConnectionPrompt(post);
    }
}
const handleChat = async (post) => {
    if (post.connected) {
        if (props.user_id == null) {
            await postStore.handleChat(post, router);
        } else {
            await profileStore.handleChat(post, router);
        }
    } else if (post.pending_connection || post.rejected_connection) {
        // Show pending connection message
        setConnectionPromptPurpose('chat');
        openConnectionPrompt(post);
    } else {
        // Show connection prompt
        setConnectionPromptPurpose('chat');
        openConnectionPrompt(post);
    }
    
}

const handleSave = async (post) => {
    if (props.user_id == null) {
        await postStore.handleSave(post);
    } else {
        await profileStore.handleSave(post);
    }
}

const handleLike = async (post) => {
    if (props.user_id == null) {
        await postStore.handleLike(post);
    } else {
        await profileStore.handleLike(post);
    }
}

const handleShareClick = (post) => {
    openShareModal(post);
}

const handleUpdatePostObj = (post) => {
    if (props.user_id == null) {
        postStore.handleUpdatePostObj(post);
    } else {
        profileStore.handleUpdatePostObj(post);
    }
}


const handleDonate = async (post) => {
  if (post.connected) {
    // If already connected, proceed with donation
    openDonationModal(post);
  } else if (post.pending_connection || post.rejected_connection) {
    // Show pending connection message
    setConnectionPromptPurpose('donate');
    openConnectionPrompt(post);
  } else {
    // Show connection prompt
    setConnectionPromptPurpose('donate');
    openConnectionPrompt(post);
  }
};

const fetchConnections = async (post) => {
  if (!post?.posted_by?.id) return;
  
  try {
    setLoadingConnections(true);
    const response = await connectionStore.fetchOurConnections(post?.posted_by?.id)
    setConnections(response.data);
    openConnectionsModal(post);
  } catch (error) {
    console.error('Error fetching connections:', error);
  } finally {
    setLoadingConnections(false);
  }
};

const handleFollowClick = async (post, showDonate = false) => {
    if (post.pending_connection) {
        fetchConnections(post);
    } else if (post.removed_connection && !post.pending_connection && !post.rejected_connection) {
        // Show modal for reconnection request
        if (props.user_id == null) {
            postStore.setSelectedUserForConnection(post);
            postStore.setShowConnectionRequestModal(true);
        } else {
            profileStore.setSelectedUserForConnection(post);
            profileStore.setShowConnectionRequestModal(true);
        }
    } else if (!post.rejected_connection) {
        if (props.user_id == null) {
            await postStore.handleFollow(post, showDonate);
        } else {
            await profileStore.handleFollow(post, showDonate);
        }
        await userStore.checkAuth();
    }
};



watch(() => profileStore.isConnectsModalOpen, async () => {
    if (profileStore.isConnectsModalOpen) {
        await connectsStore.fetchConnectsData();
    }
})
watch(() => postStore.isConnectsModalOpen, async () => {
    if (postStore.isConnectsModalOpen) {
        await connectsStore.fetchConnectsData();
    }
})

// Lifecycle
onMounted(async () => {
    if (props.user_id == null) {
        await postStore.fetchPosts();
        // After loading posts, check if we need to load a specific post from URL
        await postStore.checkUrlForPost(route);
        postStore.observePostVisibility();
            
        // Start polling after initial load
        nextTick(() => {
            postStore.startVisiblePostsPolling();
        });
    } else {
        await profileStore.fetchUserPosts();
        // After loading posts, check if we need to load a specific post from URL
        await profileStore.checkUrlForPost(route);
        profileStore.observePostVisibility();
            
        // Start polling after initial load
        nextTick(() => {
            profileStore.startVisiblePostsPolling();
        });
    }
});


onUnmounted(() => {
    if (props.user_id == null) {
        postStore.stopVisiblePostsPolling();
        if (postStore.visibilityObserver) postStore.visibilityObserver.disconnect();
        if (postStore.mutationObserver) postStore.mutationObserver.disconnect();
    } else {
        profileStore.stopVisiblePostsPolling();
        if (profileStore.visibilityObserver) profileStore.visibilityObserver.disconnect();
        if (profileStore.mutationObserver) profileStore.mutationObserver.disconnect();
    }
});
</script>
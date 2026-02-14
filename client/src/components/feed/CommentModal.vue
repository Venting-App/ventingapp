<template>
  <TransitionRoot appear :show="show" as="template">
    <Dialog as="div" class="relative z-50">
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm transition-opacity" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="w-full max-w-md h-[90vh] max-h-[850px] transform overflow-hidden rounded-3xl bg-white text-left align-middle shadow-2xl transition-all border border-zinc-100 flex flex-col">
              <!-- Header -->
              <div class="bg-white px-4 py-4 border-b border-zinc-100 flex-shrink-0">
                <div class="flex justify-between items-center">
                  <DialogTitle as="h3" class="text-lg font-bold leading-6 text-zinc-900">
                    {{ showImage ? 'Post Image' : 'Comments' }}
                  </DialogTitle>
                  <button @click="closeModal" class="rounded-full p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-all cursor-pointer">
                    <span class="sr-only">Close</span>
                    <X class="h-5 w-5" />
                  </button>
                </div>
              </div>

              <!-- Fixed User Info & View Toggle -->
              <div class="px-5 py-4 border-b border-zinc-100 bg-zinc-50/40 flex-shrink-0">
                <div class="flex justify-between items-center">
                  <PostCreator :post="post"/>
                  <div v-if="!isCurrentUserPost" class="flex items-center space-x-2">
                    <FollowButton :post="post" @follow-click="$emit('follow-click')"/>
                    <ChatButton :post="post" @chat-click="$emit('chat-click')"/>
                    <DonateButton :show-icon="true" :post="post" :processing-donation="processingDonation" @donate-click="$emit('donate-click')"/>
                  </div>
                </div>
                <div v-if="post.image_url" class="flex w-full justify-center my-2">
                  <button 
                    @click="toggleShowImage"
                    class="flex w-full items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-zinc-900 rounded-full hover:bg-violet-600 hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer"
                  >
                    <component :is="showImage ? MessageCircle : Image" class="mr-1.5 h-4 w-4" />
                    {{ showImage ? 'Show Comments' : 'Show Image' }}
                  </button>
                </div>
              </div>
              

              <!-- Dynamic Content Area -->
              <div class="flex-1 overflow-hidden flex flex-col bg-white">
                <!-- Image View -->
                <div v-if="showImage && post.image_url" class="flex-1 overflow-y-auto p-4 bg-zinc-100 flex items-center justify-center">
                  <div class="relative group max-w-full">
                    <img 
                      :src="post.image_url" 
                      :alt="'Post by ' + (post.posted_by?.username || 'user')" 
                      class="max-w-full h-auto rounded-xl shadow-lg border border-white cursor-zoom-in transition-transform duration-500 hover:scale-[1.01]"
                      @click="openImageViewer"
                    />
                    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white text-[10px] px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-bold uppercase tracking-wider">
                      Click to expand
                    </div>
                  </div>
                </div>

                <!-- Comments View (Includes Description) -->
                <div v-else class="flex-1 overflow-y-auto custom-scrollbar">
                  <!-- Description at top of scrollable area -->
                  <div class="px-5 pb-2 border-b border-zinc-50 bg-white">
                    <div class="text-[14px] text-zinc-700 leading-relaxed">
                      <ShowMore :text="post.description" />
                    </div>
                  </div>

                  <!-- Comments List -->
                  <div class="px-5 py-6 space-y-6">
                    <div v-if="loading" class="flex flex-col items-center justify-center py-12 space-y-3">
                      <div class="animate-spin rounded-full h-8 w-8 border-[3px] border-violet-100 border-t-violet-500"></div>
                      <span class="text-xs font-medium text-zinc-400 uppercase tracking-widest">Loading...</span>
                    </div>
                    
                    <div v-else-if="comments.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
                      <div class="w-14 h-14 bg-zinc-50 rounded-full flex items-center justify-center mb-4 ring-8 ring-zinc-50/50">
                        <MessageCircle class="h-7 w-7 text-zinc-300" />
                      </div>
                      <p class="text-zinc-500 text-sm font-bold">No thoughts shared yet</p>
                      <p class="text-zinc-400 text-xs mt-1">Be the first to start the conversation.</p>
                    </div>
                    
                    <div v-else class="space-y-6 pb-4">
                      <CommentItem 
                        v-for="comment in comments" 
                        :key="comment.id" 
                        :comment="comment"
                        :show-replies="showReplies[comment.id] || false"
                        :loading-replies="loadingReplies[comment.id] || false"
                        :replies="commentReplies[comment.id] || []"
                        @like="handleCommentLike"
                        @reply="handleReply"
                        @toggle-replies="toggleReplies"
                        @reply-added="handleReplyAdded(comment.id, $event)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Social Actions Bar (Mini) -->
              <div v-if="!showImage" class="px-5 py-2 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/30 flex-shrink-0">
                  <div class="flex items-center gap-4">
                    <button 
                      @click.stop="handleLike"
                      class="flex items-center space-x-1.5 text-[12px] font-bold transition-all p-1 rounded-full hover:bg-rose-50 cursor-pointer"
                      :class="post.liked ? 'text-rose-500' : 'text-zinc-400 hover:text-rose-500'"
                    >
                      <Heart :size="16" :fill="post.liked ? 'currentColor' : 'none'" :stroke-width="2.5" />
                      <span>{{ post.likes || 0 }}</span>
                    </button>
                    <button 
                      @click.stop="handleSave"
                      class="flex items-center space-x-1.5 text-[12px] font-bold transition-all p-1 rounded-full hover:bg-violet-50 cursor-pointer"
                      :class="post.saved ? 'text-violet-600' : 'text-zinc-400 hover:text-violet-600'"
                    >
                      <Bookmark :size="16" :fill="post.saved ? 'currentColor' : 'none'" :stroke-width="2.5" />
                    </button>
                  </div>
                  <button 
                    @click.stop="handleShare"
                    class="flex items-center space-x-1.5 text-[12px] font-bold text-zinc-400 hover:text-emerald-600 transition-all p-1 rounded-full hover:bg-emerald-50 cursor-pointer"
                  >
                    <Share2 :size="16" :stroke-width="2.5" />
                  </button>
              </div>

              <!-- Comment Input Bar (Always Pinned) -->
              <div v-if="!post.archived" class="bg-white px-5 py-4 border-t border-zinc-100 flex-shrink-0 shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.03)]">
                <div class="flex items-center space-x-3">
                  <div v-if="profilePicture" class="h-9 w-9 rounded-full overflow-hidden bg-violet-100 ring-2 ring-white shadow-sm flex-shrink-0">
                    <img :src="profilePicture" alt="Profile" class="h-full w-full object-cover" />
                  </div>
                  <div v-else class="flex-shrink-0 h-9 w-9 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-400 ring-2 ring-white">
                    {{ userInitials }}
                  </div>
                  <div class="flex-1 relative">
                    <input
                      v-model="newComment"
                      type="text"
                      maxlength="400"
                      placeholder="Type your reply..."
                      class="block w-full rounded-full border border-zinc-200 bg-zinc-50 pl-5 pr-12 py-3 text-sm text-zinc-800 placeholder-zinc-400 focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 focus:bg-white transition-all outline-none"
                      @keyup.enter="addComment"
                    />
                    <button 
                      @click="addComment"
                      :disabled="!newComment.trim()"
                      class="absolute right-1.5 top-1/2 transform -translate-y-1/2 p-2 rounded-full text-white bg-zinc-900 hover:bg-violet-600 disabled:opacity-30 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
                    >
                      <Send class="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
      
      <!-- ImageViewer for post image -->
      <ImageViewer
        v-if="showImageViewer"
        v-model="showImageViewer"
        :src="post.image_url"
        :alt="'Post by ' + (post.posted_by?.username || 'user')"
        @close="showImageViewer = false"
      />

      <!-- Report Modal -->
      <ReportModal
        v-if="isReportModalOpen"
        :is-open="isReportModalOpen"
        :is-submitting="isSubmittingReport"
        @close="isReportModalOpen = false"
        @submit="submitReport"
      />
      <FeedModals
        v-if="show"
        :user_id="user_id"
        @follow-click="(...args) => $emit('follow-click', ...args)"
      />

    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { ref, watch, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useUserStore } from '@/stores/user';
import { useRouter, useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue';
import ShowMore from '@/components/ShowMore.vue';
import CommentItem from './CommentItem.vue';
import ReportModal from './ReportModal.vue';
import ImageViewer from '@/components/common/ImageViewer.vue';
import { X, EllipsisVertical, Heart, Bookmark, Share2, Send, MessageCircle, Image } from 'lucide-vue-next';
import { usePostStore } from '@/stores/post';
import { useCommentStore } from '@/stores/comment';
import FollowButton from '@/components/FollowButton.vue';
import ChatButton from '@/components/ChatButton.vue';
import DonateButton from '@/components/DonateButton.vue';
import PostCreator from '@/components/PostCreator.vue';
import FeedModals from '@/components/feed/FeedModals.vue';
// Click outside directive
const vClickOutside = {
  beforeMount(el, binding) {
    el.clickOutsideEvent = function(event) {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value();
      }
    };
    document.addEventListener('click', el.clickOutsideEvent);
  },
  unmounted(el) {
    document.removeEventListener('click', el.clickOutsideEvent);
  },
};

const props = defineProps({
  processingDonation: {
    type: Boolean,
    default: false
  },
  isCurrentUserPost: {
    type: Boolean,
    default: false
  },
  show: {
    type: Boolean,
    default: false
  },
  user_id: {
    type: [String, Number],
    default: null
  },
  post: {
    type: Object,
    required: true,
    default: () => ({
      id: null,
      posted_by: {},
      description: '',
      formatted_created_at: ''
    })
  }
});

const emit = defineEmits([
  'close',
  'update:post',
  'comment-added',
  'like',
  'save',
  'share',
  'follow-click',
  'chat-click',
  'donate-click',
]);

const router = useRouter();
const route = useRoute();
const postStore = usePostStore();
const commentStore = useCommentStore();
const showImageViewer = ref(false);
const showImage = ref(false);

const toggleShowImage = () => {
  showImage.value = !showImage.value;
};

const openImageViewer = (e) => {
  if (!props.post.image_url) return;
  showImageViewer.value = true;
};

// Handle browser back button
const handlePopState = () => {
  if (props.show) {
    closeModal();
  }
};

onMounted(() => {
  window.addEventListener('popstate', handlePopState);
});

onBeforeUnmount(() => {
  window.removeEventListener('popstate', handlePopState);
});

const closeModal = () => {
  const url = new URL(window.location.href);
  if (url.searchParams.has('p')) {
    url.searchParams.delete('p');
    window.history.replaceState({}, '', url);
  }
  emit('close');
};

const handleLike = () => {
  emit('like')
}

const handleSave = () => {
  emit('save')
};

const handleShare = async () => {
  emit('share')
};

const isReportModalOpen = ref(false);
const isSubmittingReport = ref(false);

const handleReportPost = () => {
  showReportMenu.value = false;
  isReportModalOpen.value = true;
};

const submitReport = async (reason) => {
  isSubmittingReport.value = true;
  try {
    const response = await postStore.submitReport(props.post.id, reason);
    if (response.data.error) {
      message.error(response.data.error);
    } else {
      message.success('Post reported successfully');
    }
  } catch (error) {
    console.error('Error reporting post:', error);
    const errorMessage = error.response?.data?.error || 'Failed to report post';
    message.error(errorMessage);
  } finally {
    isSubmittingReport.value = false;
    isReportModalOpen.value = false;
  }
};

const userStore = useUserStore();
const comments = ref([]);
const loading = ref(false);
const newComment = ref('');
const loadingReplies = ref({});
const showReplies = ref({});
const commentReplies = ref({});
const commentRefs = ref({});
const showReportMenu = ref(false);

const scrollToComment = (id) => {
  nextTick(() => {
    const el = commentRefs.value[id]?.$el || commentRefs.value[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      el.classList.add('highlight-new');
      setTimeout(() => {
        el.classList.remove('highlight-new');
      }, 1500);
    }
  });
};

const userInitials = computed(() => {
  if (!userStore.user?.name) return 'U';
  return userStore.user.name
    .split(' ')
    .map(n => n[0].toUpperCase())
    .join('')
    .substring(0, 2);
});

const profilePicture = computed(() => {
  return userStore.user?.profile_picture;
});

const fetchComments = async () => {
  if (!props.post.id) return;
  try {
    loading.value = true;
    const response = await postStore.fetchComments(props.post.id);
    comments.value = response.data.results || [];
  } catch (error) {
    console.error('Error fetching comments:', error);
    message.error('Failed to load comments');
  } finally {
    loading.value = false;
  }
};

const handleCommentLike = (updatedComment) => {
  const index = comments.value.findIndex(c => c.id === updatedComment.id);
  if (index !== -1) {
    comments.value[index] = { ...comments.value[index], ...updatedComment };
  }
  for (const commentId in commentReplies.value) {
    const replyIndex = commentReplies.value[commentId].findIndex(r => r.id === updatedComment.id);
    if (replyIndex !== -1) {
      commentReplies.value[commentId][replyIndex] = updatedComment;
      break;
    }
  }
};

const handleReply = (commentId) => {};

const handleReplyAdded = (top_id, data) => {
  if (!top_id) return;
  const is_nested = data['is_reply'];
  const newObj = data['data']['comment'];
  const post_comments_count = data['data']['post_comments'];
  commentReplies.value ??= {};
  if (!Array.isArray(commentReplies.value[top_id])) {
    commentReplies.value = { ...commentReplies.value, [top_id]: [] };
  }
  if (is_nested) {
    const insertIndex = data['index'] + 1;
    commentReplies.value[top_id].splice(insertIndex, 0, newObj);
  } else {
    commentReplies.value[top_id].unshift(newObj);
  }
  const comment = comments.value.find(c => c.id === top_id);
  if (comment) {
    comment.replies = (comment.replies || 0) + 1;
  }
  showReplies.value[top_id] = true;
  emit('update:post', {
    ...props.post,
    comments: post_comments_count
  });
};

const addComment = async () => {
  if (!newComment.value.trim()) return;
  if (showImage.value) {
    showImage.value = false;
  }
  try {
    const response = await postStore.submitComment(props.post.id, newComment.value.trim());
    const post_comments_count = response.data.post_comments;
    const new_comment_obj = response.data.comment;
    comments.value = [new_comment_obj, ...comments.value];
    newComment.value = '';
    nextTick(() => {
      scrollToComment(new_comment_obj.id);
    });
    emit('update:post', {
      ...props.post,
      comments: post_comments_count
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    message.error('Failed to add comment');
  }
};

const toggleReplies = async (comment) => {
  showReplies.value[comment.id] = !showReplies.value[comment.id];
  if (showReplies.value[comment.id] && !commentReplies.value[comment.id]) {
    await fetchReplies(comment.id);
  }
};

const fetchReplies = async (commentId) => {
  try {
    loadingReplies.value[commentId] = true;
    const response = await commentStore.getReplies(commentId);
    commentReplies.value[commentId] = response.data.results || [];
  } catch (error) {
    console.error('Error fetching replies:', error);
    message.error('Failed to load replies');
  } finally {
    loadingReplies.value[commentId] = false;
  }
};

watch(() => props.show, (newVal) => {
  if (newVal) {
    if (props.post?.id) {
        const url = new URL(window.location.href);
        if (url.searchParams.get('p') !== String(props.post.id)) {
            url.searchParams.set('p', props.post.id);
            window.history.replaceState({}, '', url);
        }
    }
    fetchComments();
  } else {
    const url = new URL(window.location.href);
    if (url.searchParams.has('p')) {
        url.searchParams.delete('p');
        window.history.replaceState({}, '', url);
    }
  }
}, { immediate: true });
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e4e4e7;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #d1d1d6;
}

@keyframes highlight {
  0% { background-color: rgba(124, 58, 237, 0.08); }
  100% { background-color: transparent; }
}

.highlight-new {
  animation: highlight 2s ease-out;
  border-radius: 1rem;
}
</style>
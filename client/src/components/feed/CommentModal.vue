<template>
  <TransitionRoot appear :show="show" as="template">
    <Dialog as="div" class="relative z-50" @close="closeModal">
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
            <DialogPanel class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-2xl transition-all border border-zinc-100">
              <!-- Header -->
              <div class="bg-white/50 backdrop-blur-xl px-4 py-4 border-b border-zinc-100 sticky top-0 z-10">
                <div class="flex justify-between items-center">
                  <DialogTitle as="h3" class="text-lg font-bold leading-6 text-zinc-900">
                    Comments
                  </DialogTitle>
                  <button @click="closeModal" class="rounded-full p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 focus:outline-none transition-all cursor-pointer">
                    <span class="sr-only">Close</span>
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Post Content Summary -->
              <div class="px-5 py-4 border-b border-zinc-50 bg-zinc-50/30">
                <div class="flex justify-between items-start">
                  <div class="flex space-x-3 flex-1">
                    <div v-if="post.posted_by?.profile_picture" class="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden ring-2 ring-white shadow-sm">
                      <img 
                        :src="post.posted_by.profile_picture" 
                        :alt="post.posted_by.name"
                        class="h-full w-full object-cover"
                      />
                    </div>
                    <div v-else class="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center text-sm font-bold text-zinc-400 ring-2 ring-white">
                      {{ post.posted_by?.name ? post.posted_by.name.charAt(0).toUpperCase() : 'U' }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="font-semibold text-sm text-zinc-900">{{ post.posted_by?.name || 'Anonymous' }}</p>
                      <div class="text-sm text-zinc-600 mt-0.5">
                        <ShowMore :text="post.description"/>
                      </div>
                      <p class="text-xs text-zinc-400 mt-1 font-medium">{{ post.formatted_created_at }}</p>
                    </div>
                  </div>
                  <!-- Three dots menu -->
                  <div class="relative ml-2">
                    <button 
                      @click.stop="showReportMenu = !showReportMenu" 
                      class="p-1 rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors focus:outline-none"
                    >
                      <EllipsisVertical class="h-5 w-5" />
                    </button>
                    
                    <!-- Dropdown menu -->
                    <div 
                      v-if="showReportMenu" 
                      class="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-zinc-100 py-1 z-50 overflow-hidden"
                      v-click-outside="() => showReportMenu = false"
                    >
                      <button 
                        @click="handleReportPost"
                        class="block w-full text-left px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 font-medium transition-colors cursor-pointer"
                      >
                        Report Post
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Post Actions -->
                <div class="flex justify-between items-center mt-3 pt-2">
                  <button 
                    @click.stop="handleLike"
                    class="flex items-center space-x-1.5 text-sm font-medium transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-rose-50"
                    :class="post.liked ? 'text-rose-500' : 'text-zinc-500 hover:text-rose-500'"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      class="h-5 w-5" 
                      :fill="post.liked ? 'currentColor' : 'none'" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                      :stroke-width="post.liked ? 0 : 2"
                    >
                      <path 
                        stroke-linecap="round" 
                        stroke-linejoin="round" 
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                      />
                    </svg>
                    <span>{{ post.likes || 0 }}</span>
                  </button>
                  
                  <button 
                    @click.stop="handleSave"
                    class="flex items-center space-x-1.5 text-sm font-medium transition-colors py-1 px-2 rounded-lg hover:bg-violet-50"
                    :class="post.saved ? 'text-violet-600' : 'text-zinc-500 hover:text-violet-600'"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      class="h-5 w-5" 
                      :fill="post.saved ? 'currentColor' : 'none'" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                      :stroke-width="post.saved ? 0 : 2"
                    >
                      <path 
                        stroke-linecap="round" 
                        stroke-linejoin="round" 
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" 
                      />
                    </svg>
                    <span>Save</span>
                  </button>
                  
                  <button 
                    @click.stop="handleShare"
                    class="flex items-center space-x-1.5 text-sm font-medium text-zinc-500 hover:text-emerald-600 transition-colors py-1 px-2 -mr-2 rounded-lg hover:bg-emerald-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span>Share</span>
                  </button>
                </div>
              </div>

              <!-- Comments Section -->
              <div class="h-[50vh] overflow-y-auto px-5 py-4 bg-white">
                <div v-if="loading" class="flex flex-col items-center justify-center py-12 space-y-3">
                  <div class="animate-spin rounded-full h-8 w-8 border-[3px] border-violet-100 border-t-violet-500"></div>
                  <span class="text-xs font-medium text-zinc-400">Loading conversation...</span>
                </div>
                
                <div v-else-if="comments.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
                  <div class="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p class="text-zinc-500 text-sm font-medium">No comments yet.</p>
                  <p class="text-zinc-400 text-xs mt-1">Start the conversation gently.</p>
                </div>
                
                <div v-else class="space-y-5">
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

              <!-- Comment Input -->
              <div v-if="!post.archived" class="bg-white px-5 py-4 border-t border-zinc-100 sticky bottom-0 z-10">
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
                      placeholder="Share your thoughts..."
                      class="block w-full rounded-full border border-zinc-200 bg-zinc-50 pl-5 pr-12 py-2.5 text-sm text-zinc-800 placeholder-zinc-400 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:bg-white transition-all"
                      @keyup.enter="addComment"
                    />
                    <button 
                      @click="addComment"
                      :disabled="!newComment.trim()"
                      class="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full text-violet-600 hover:bg-violet-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
      
      <!-- Report Modal -->
      <ReportModal
        v-if="isReportModalOpen"
        :is-open="isReportModalOpen"
        :is-submitting="isSubmittingReport"
        @close="isReportModalOpen = false"
        @submit="submitReport"
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
import { EllipsisVertical } from 'lucide-vue-next';
import { usePostStore } from '@/stores/post';
import { useCommentStore } from '@/stores/comment';
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
  show: {
    type: Boolean,
    default: false
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
  'share'
]);

const router = useRouter();
const route = useRoute();
const postStore = usePostStore();
const commentStore = useCommentStore();
// Handle browser back button
const handlePopState = () => {
  if (props.show) {
    closeModal();
  }
};

// Setup popstate listener when component mounts
onMounted(() => {
  window.addEventListener('popstate', handlePopState);
});

// Cleanup popstate listener when component unmounts
onBeforeUnmount(() => {
  window.removeEventListener('popstate', handlePopState);
});

const closeModal = () => {
  // Remove the post ID from URL when closing using window.history to prevent router refresh
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

// Scroll to a specific comment
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
  // Update the comment in the comments list
  const index = comments.value.findIndex(c => c.id === updatedComment.id);
  if (index !== -1) {
    comments.value[index] = { ...comments.value[index], ...updatedComment };
  }
  
  // If this is a reply, update it in the replies list
  for (const commentId in commentReplies.value) {
    const replyIndex = commentReplies.value[commentId].findIndex(r => r.id === updatedComment.id);
    if (replyIndex !== -1) {
      commentReplies.value[commentId][replyIndex] = updatedComment;
      break;
    }
  }
};

const handleReply = (commentId) => {
  // This is handled within the CommentItem component now
};

const handleReplyAdded = (top_id, data) => {
  if (!top_id) return; // safety check

  const is_nested = data['is_reply'];
  const newObj = data['data']['comment'];
  const post_comments_count = data['data']['post_comments'];

  // Ensure outer object exists
  commentReplies.value ??= {};

  // Ensure replies array exists for this comment (use shallow clone for reactivity)
  if (!Array.isArray(commentReplies.value[top_id])) {
    commentReplies.value = { ...commentReplies.value, [top_id]: [] };
  }

  if (is_nested) {
    // Insert nested reply after parent
    const insertIndex = data['index'] + 1;
    commentReplies.value[top_id].splice(insertIndex, 0, newObj);
  } else {
    // Add new top-level reply at the front
    commentReplies.value[top_id].unshift(newObj);
  }

  // Update replies count in parent comment
  const comment = comments.value.find(c => c.id === top_id);
  if (comment) {
    comment.replies = (comment.replies || 0) + 1;
  }

  // Show replies section
  showReplies.value[top_id] = true;

  // Update post's total comment count
  emit('update:post', {
    ...props.post,
    comments: post_comments_count
  });
};

const addComment = async () => {
  if (!newComment.value.trim()) return;
  
  try {
    const response = await postStore.submitComment(props.post.id, newComment.value.trim());
    const post_comments_count = response.data.post_comments;
    const new_comment_obj = response.data.comment;
    
    // Add the new comment to the beginning of the list
    comments.value = [new_comment_obj, ...comments.value];
    newComment.value = '';
    
    // Scroll to the new comment after it's added
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
  
  // If we're showing replies and haven't loaded them yet, fetch them
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

// Handle URL and fetch comments when modal is opened/closed
watch(() => props.show, (newVal) => {
  if (newVal) {
    // Add post ID to URL when modal opens using window.history to prevent router refresh
    if (props.post?.id) {
        const url = new URL(window.location.href);
        // Only update if not already there
        if (url.searchParams.get('p') !== String(props.post.id)) {
            url.searchParams.set('p', props.post.id);
            window.history.replaceState({}, '', url);
        }
    }
    fetchComments();
  } else {
    // URL cleanup handled in closeModal if triggered by UI, or here if triggered by prop change.
    // To be safe, we can check and clean here too, but closeModal does it. 
    // If show becomes false from external source, we might want to clean up.
    const url = new URL(window.location.href);
    if (url.searchParams.has('p')) {
        url.searchParams.delete('p');
        window.history.replaceState({}, '', url);
    }
  }
}, { immediate: true });
</script>

<style scoped>
/* Animation for comments list */
.comment-list-move,
.comment-list-enter-active,
.comment-list-leave-active {
  transition: all 0.3s ease;
}

.comment-list-enter-from,
.comment-list-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.comment-list-leave-active {
  position: absolute;
  width: 100%;
}

/* Highlight animation for new comments */
@keyframes highlight {
  0% { background-color: rgba(239, 246, 255, 0.5); }
  100% { background-color: transparent; }
}

.highlight-new {
  animation: highlight 1.5s ease-out;
  border-radius: 0.5rem;
}

/* Smooth transition for the comment input */
.comment-input-enter-active,
.comment-input-leave-active {
  transition: all 0.3s ease;
  max-height: 100px;
  overflow: hidden;
}

.comment-input-enter-from,
.comment-input-leave-to {
  opacity: 0;
  max-height: 0;
  margin: 0;
  padding: 0;
}
</style>
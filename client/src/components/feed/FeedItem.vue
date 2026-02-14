<template>
  <div class="bg-white rounded-[1.25rem] shadow-sm border border-zinc-100/80 transition-all duration-300 hover:shadow-md overflow-hidden group">
    
    <!-- Post Header -->
    <div class="px-5 pt-5 pb-3 flex items-start justify-between">
      <PostCreator :post="post"/>
      
      <div v-if="!isCurrentUserPost" class="flex items-center space-x-2">
        <FollowButton :post="post" @follow-click="$emit('follow-click')"/>
        <ChatButton :post="post" @chat-click="$emit('chat-click')"/>
        <DonateButton :show-icon="!postStore.isDesktop" :post="post" :processing-donation="processingDonation" @donate-click="$emit('donate-click')"/>
      </div>
    </div>
    
    <!-- Post Content -->
    <div class="px-5 pb-2">
      <div class="text-zinc-700 text-[15px] leading-[1.7] font-normal tracking-wide">
        <ShowMore :text="post.description"/>
      </div>
      
      <!-- Post Image -->
      <div v-if="post.image_url" class="mt-4 rounded-xl overflow-hidden border border-zinc-100 bg-zinc-50 relative group/image">
        <div class="absolute inset-0 bg-black/0 group-hover/image:bg-black/5 transition-colors duration-300 pointer-events-none z-10"></div>
        <img 
          :src="post.image_url" 
          :alt="'Post by ' + (post.posted_by?.username || 'user')" 
          class="w-full h-auto object-cover cursor-zoom-in transition-transform duration-500 group-hover/image:scale-[1.02]"
          @click="openImageViewer"
        />
      </div>

       <!-- Image Viewer -->
      <ImageViewer
        v-if="showImageViewer"
        v-model="showImageViewer"
        :src="post.image_url"
        :alt="'Post by ' + (post.posted_by?.username || 'user')"
        @close="showImageViewer = false"
      />
    </div>
    
    <!-- Post Stats -->
    <div class="px-5 pt-3 pb-1 flex items-center justify-between text-xs font-medium text-zinc-400">
        <div class="flex items-center gap-3">
            <span>{{ post.likes }} {{ post.likes === 1 ? 'Like' : 'Likes' }}</span>
            <span>{{ post.comments }} {{ post.comments === 1 ? 'Comment' : 'Comments' }}</span>
        </div>
        <div class="flex items-center gap-3">
            <span>{{ post.views }} {{ post.views === 1 ? 'View' : 'Views' }}</span>
            <span v-if="post.forwards > 0">{{ post.forwards }} {{ post.forwards === 1 ? 'Share' : 'Shares' }}</span>
        </div>
    </div>

    <!-- Action Buttons -->
    <div class="px-3 py-2 border-t border-zinc-50 mt-1">
      <div class="flex items-center justify-between">
        <!-- Like Button -->
        <button 
          @click="$emit('like-click')" 
          class="cursor-pointer flex-1 flex items-center justify-center py-2.5 rounded-lg transition-all duration-200 group/btn hover:bg-zinc-50"
          :class="[{
            'text-rose-500': post.liked && !liking,
            'text-zinc-400 hover:text-rose-500': !post.liked && !liking,
            'opacity-50 cursor-not-allowed': liking
          }]"
          :disabled="liking"
          title="Like"
        >
          <div class="relative">
             <Loader2 v-if="liking" class="w-5 h-5 animate-spin text-rose-400" />
             <Heart v-else :size="20" :fill="post.liked ? 'currentColor' : 'none'" class="transition-transform duration-200 group-active/btn:scale-90" />
          </div>
        </button>
        
        <!-- Comment Button -->
        <button 
          @click="handleCommentClick(post)" 
          class="cursor-pointer flex-1 flex items-center justify-center py-2.5 rounded-lg text-zinc-400 hover:bg-zinc-50 hover:text-violet-600 transition-all duration-200 group/btn"
          title="Comment"
        >
          <MessageCircle :size="20" class="transition-transform duration-200 group-active/btn:scale-90" />
        </button>
        
        <!-- Save Button -->
        <button 
          @click="$emit('save-click')" 
          class="cursor-pointer flex-1 flex items-center justify-center py-2.5 rounded-lg transition-all duration-200 group/btn hover:bg-zinc-50"
          :class="[{
            'text-violet-600': post.saved && !saving,
            'text-zinc-400 hover:text-violet-600': !post.saved && !saving,
            'opacity-50 cursor-not-allowed': saving
          }]"
          :disabled="saving"
          title="Save"
        >
           <Loader2 v-if="saving" class="w-5 h-5 animate-spin text-violet-400" />
           <Bookmark v-else :size="20" :fill="post.saved ? 'currentColor' : 'none'" class="transition-transform duration-200 group-active/btn:scale-90" />
        </button>
        
        <!-- Share Button -->
        <button 
          @click="$emit('share-click')" 
          class="cursor-pointer flex-1 flex items-center justify-center py-2.5 rounded-lg text-zinc-400 hover:bg-zinc-50 hover:text-emerald-600 transition-all duration-200 group/btn"
          title="Share"
        >
          <Share2 :size="20" class="transition-transform duration-200 group-active/btn:scale-90" />
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { usePostStore } from '@/stores/post';
import ImageViewer from '@/components/common/ImageViewer.vue';
import ShowMore from '@/components/ShowMore.vue';
import FollowButton from '@/components/FollowButton.vue';
import { Heart, MessageCircle, Bookmark, Share2, Loader2, UserPlus, UserCheck, Clock, UserX, Send } from 'lucide-vue-next';
import ChatButton from '@/components/ChatButton.vue';
import DonateButton from '@/components/DonateButton.vue';
import PostCreator from '@/components/PostCreator.vue';

const postStore = usePostStore();
const props = defineProps({
  processingDonation: {
    type: Boolean,
    required: true
  },
  isCurrentUserPost: {
    type: Boolean,
    required: true,
  },
  post: {
    type: Object,
    required: true
  },
  liking: {
    type: Boolean,
    default: false
  },
  saving: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  'donate-click', 'chat-click', 
  'save-click', 'like-click',
  'follow-click', 'comment-click', 'share-click'
]);
const route = useRoute();
const handleCommentClick = () => {
  emit('comment-click')
};

const userStore = useUserStore();
const showImageViewer = ref(false);

// Watch for URL changes to handle direct comment modal opening
watch(() => route.query.p, (newPostId) => {
  if (newPostId && String(props.post.id) === String(newPostId)) {
    handleCommentClick(props.post)
  }
}, { immediate: true });

// Handle initial load
onMounted(() => {
  if (route.query.p && String(props.post.id) === String(route.query.p)) {
    handleCommentClick(props.post)
  }
});

const openImageViewer = (e) => {
  if (!props.post.image_url) return;
  showImageViewer.value = true;
};

</script>

<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" class="relative z-20" @close="closeModal">
      <!-- Backdrop -->
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-zinc-900/80 backdrop-blur-sm transition-opacity" />
      </TransitionChild>

      <!-- Scrollable Container -->
      <div class="fixed inset-0 z-10 overflow-y-auto">
        <!-- Layout Container -->
        <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel class="relative transform transition-all my-30 sm:w-full sm:max-w-xl">
               <!-- Close Button -->
               <div class="absolute -top-12 right-0 z-10">
                  <button 
                    @click="closeModal" 
                    class="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X class="h-6 w-6" />
                  </button>
               </div>
               
               <!-- Content -->
               <div class="text-left w-full">
                  <div v-if="loading" class="flex justify-center items-center h-64 bg-white rounded-[1.25rem]">
                      <Loader2 class="h-8 w-8 animate-spin text-violet-600" />
                  </div>
                  <div v-else-if="post">
                    <FeedItem 
                      :post="post"
                      :liking="liking"
                      :saving="saving"
                      @like="handleLike"
                      @save="handleSave"
                      @chat="handleChat"
                      @donate="openDonationModal"
                      @follow="handleFollowClick"
                      @update:post="handlePostUpdate"
                    />
                  </div>
               </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue';
import { X, Loader2 } from 'lucide-vue-next';
import FeedItem from '@/components/feed/FeedItem.vue';
import { usePostStore } from '@/stores/post';
import { useUserStore } from '@/stores/user';
import { useRouter } from 'vue-router';
const router = useRouter();
const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  postId: {
    type: [String, Number],
    default: null
  }
});

const emit = defineEmits(['close', 'update:post']);

const postStore = usePostStore();
const userStore = useUserStore();
const post = ref(null);
const loading = ref(false);

const liking = computed(() => postStore.likingPostId === post.value?.id);
const saving = computed(() => postStore.savingPostId === post.value?.id);

const fetchPost = async (isBackground = false) => {
    if (!props.postId) return;
    
    if (!isBackground) {
        loading.value = true;
        post.value = null; // Clear previous post to prevent flashing old data
    }
    
    try {
        const response = await postStore.fetchPostById(props.postId);
        post.value = response;
    } catch (error) {
        console.error("Failed to fetch post details", error);
    } finally {
        if (!isBackground) {
            loading.value = false;
        }
    }
};

// Watch both isOpen and postId changes
watch(
  [() => props.isOpen, () => props.postId],
  async ([newOpen, newId]) => {
    if (newOpen && newId) {
        fetchPost(false);
    }
  },
  { immediate: true }
);

const handleLike = async (p) => {
    await postStore.handleLike(p);
    await fetchPost(true);
};

const handleSave = async (p) => {
    await postStore.handleSave(p);
    await fetchPost(true);
};

const handleChat = async (p) => {
    await postStore.handleChat(p, router);
    await fetchPost(true);
};

const openDonationModal = (p) => {
    postStore.openDonationModal(p);
};

const handleFollowClick = async (p, showDonate) => {
    if (p.removed_connection && !p.pending_connection && !p.rejected_connection) {
        postStore.setSelectedUserForConnection(p);
        postStore.setShowConnectionRequestModal(true);
    } else {
        await postStore.handleFollow(p, showDonate);
        await userStore.checkAuth();
        await fetchPost(true);
    }
};

const handlePostUpdate = (updatedPost) => {
    post.value = updatedPost;
    postStore.handleUpdatePostObj(updatedPost);
    emit('update:post', updatedPost);
};

const closeModal = () => {
  emit('close');
};
</script>
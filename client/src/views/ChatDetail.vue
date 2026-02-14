<template>
  <div class="bg-zinc-50 h-screen flex flex-col relative font-sans">
    <!-- New Messages Indicator -->
    <div 
      v-if="showNewMessagesIndicator" 
      @click="scrollToNewMessages"
      class="fixed bottom-24 mt-2 left-1/2 transform -translate-x-1/2 bg-zinc-900 text-white rounded-full px-4 py-2 shadow-lg cursor-pointer hover:bg-zinc-800 transition-all z-20 flex items-center space-x-2 animate-bounce"
      :title="`${newMessagesCount} new message${newMessagesCount > 1 ? 's' : ''}`"
    >
      <div class="flex items-center space-x-2 text-sm font-semibold">
        <ArrowDown class="h-4 w-4" />
        <span>{{ newMessagesCount }} new messages</span>
      </div>
    </div>

    <!-- Header -->
    <div class="bg-white/80 backdrop-blur-md border-b border-zinc-200/80 px-4 py-3 flex items-center shadow-sm sticky top-0 z-20">
      <button 
        @click="$router.back()" 
        class="mr-3 p-2 rounded-full hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
      >
        <ArrowLeft class="h-5 w-5"/>
      </button>
      
      <div class="flex items-center space-x-3 flex-1 cursor-pointer" @click="goToProfile">
        <!-- Profile Picture -->
        <div v-if="otherUser?.profile_picture" class="flex-shrink-0 relative">
          <img 
            :src="otherUser.profile_picture" 
            :alt="otherUser.name || otherUser.username"
            class="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm"
          >
        </div>
        <div v-else class="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 ring-2 ring-white shadow-sm">
          <span class="text-violet-600 font-bold">
            {{ (otherUser?.name || otherUser?.username || 'U').charAt(0).toUpperCase() }}
          </span>
        </div>
        
        <!-- User Info -->
        <div class="min-w-0">
          <h2 class="text-base font-bold text-zinc-900 truncate flex items-center gap-1">
            {{ conversation.name || otherUser?.name || otherUser?.username || 'Chat' }}
          </h2>
          <p v-if="otherUser?.username" class="text-xs text-zinc-500 truncate font-medium">
            @{{ otherUser.username }}
          </p>
        </div>
      </div>
      
      <!-- Conversation Actions -->
      <div class="relative">
         <button 
            @click.stop="toggleConversationMenu" 
            class="p-2 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
         >
            <EllipsisVertical class="h-5 w-5" />
         </button>
      </div>
    </div>


    <!-- Messages -->
    <div ref="messagesContainer" class="flex-1 overflow-y-auto px-4 py-4 space-y-6 messages-container scroll-smooth">
      <!-- Load More Button -->
      <div v-if="pagination.next" class="flex justify-center py-2">
        <button 
          @click="fetchMessages(true)" 
          :disabled="pagination.isLoading"
          class="px-4 py-1.5 text-xs font-medium text-zinc-500 bg-white border border-zinc-200 shadow-sm hover:bg-zinc-50 rounded-full flex items-center space-x-2 transition-colors cursor-pointer"
        >
          <span v-if="pagination.isLoading" class="animate-spin h-3 w-3 border-2 border-zinc-400 border-t-zinc-600 rounded-full"></span>
          <span>{{ pagination.isLoading ? 'Loading...' : 'Load previous messages' }}</span>
        </button>
      </div>
      
      <div v-if="loadingMessages" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-[3px] border-violet-200 border-t-violet-600"></div>
      </div>
      
      <!-- Empty state -->
      <div v-else-if="!loadingMessages && messages.length === 0" class="h-full flex flex-col items-center justify-center text-center p-8">
        <div class="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
            <MessageCircle class="h-10 w-10 text-zinc-300" />
        </div>
        <h3 class="text-lg font-bold text-zinc-900">No messages yet</h3>
        <p class="mt-1 text-sm text-zinc-500 max-w-xs">Send a message to start the conversation with {{ otherUser?.name || 'this user' }}.</p>
      </div>

      <div 
        v-for="(message, index) in messages" 
        :key="message.id"
        :id="`message-${message.id}`"
        :class="[
          'relative flex w-full', 
          message.user.id === currentUser.id ? 'justify-end' : 'justify-start',
          { 'highlight-message': highlightedMessageId === message.id }
        ]"
      >
        <!-- New messages divider -->
        <div 
          v-if="showNewMessageDivider && index === firstNewMessageIndex" 
          class="absolute -top-8 left-0 right-0 flex items-center justify-center"
        >
          <div class="bg-violet-100 text-violet-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-sm border border-violet-200">
            New Messages
          </div>
        </div>

        <!-- Avatar for received messages -->
        <div v-if="message.user.id !== currentUser.id" class="flex-shrink-0 mr-3 self-end mb-1">
          <img 
            v-if="message.user.profile_picture"
            :src="message.user.profile_picture"
            :alt="message.user.name"
            class="h-8 w-8 rounded-full object-cover ring-2 ring-white shadow-sm"
          >
          <div v-else class="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-600 ring-2 ring-white shadow-sm">
            {{ message.user.name ? message.user.name.charAt(0).toUpperCase() : 'U' }}
          </div>
        </div>

        <!-- Message container -->
        <div class="relative group max-w-[85%] sm:max-w-[70%]">
          <!-- Reply preview -->
          <div v-if="message.reply_to" 
               class="mb-1 text-xs cursor-pointer bg-zinc-100/80 backdrop-blur-sm p-2 rounded-xl border border-zinc-200 hover:bg-zinc-200/80 transition-colors relative"
               :class="message.user.id === currentUser.id ? 'mr-1 rounded-br-none' : 'ml-1 rounded-bl-none'"
               @click="scrollToMessage(message.reply_to.id)">
            <div class="flex items-center gap-1 text-zinc-500 font-semibold mb-0.5">
               <Reply class="w-3 h-3" />
               <span>Reply to {{ message.reply_to.user.id === currentUser.id ? 'You' : message.reply_to.user.name }}</span>
            </div>
            <div class="truncate text-zinc-600 italic px-1">
              "{{ 
                message.reply_to.message || 
                message.reply_to?.forwarded_from?.message  ||
                (message?.reply_to?.shared_post?.description && "Post: " + message?.reply_to?.shared_post?.description)
              }}"
            </div>
          </div>
          
          <!-- Message bubble -->
           <div class="flex gap-2" :class="[message.user.id === currentUser.id ? 'flex-row-reverse' : 'flex-row']">
            <div 
              :class="[
                'relative px-4 py-2.5 shadow-sm text-sm break-words',
                message.user.id === currentUser.id 
                  ? 'bg-zinc-900 text-white rounded-2xl rounded-tr-sm' 
                  : 'bg-white text-zinc-800 border border-zinc-200 rounded-2xl rounded-tl-sm',
              ]"
              @mouseenter="showActions = message.id"
              @mouseleave="handleMouseLeave">
              
              <!-- Banned Warning -->
              <div v-if="message.banned" class="mb-1 flex items-center text-xs text-rose-500 font-bold bg-rose-50 px-2 py-1 rounded">
                 <AlertTriangle class="h-3 w-3 mr-1" />
                 <span>Message Content Hidden (Banned)</span>
              </div>

              <!-- Forwarded message indicator -->
              <div v-if="message.forwarded_from" class="mb-1.5 flex items-center text-xs opacity-70 italic">
                <Forward class="h-3 w-3 mr-1" />
                <span>Forwarded from {{ message.forwarded_from.user.name }}</span>
              </div>
              
              <!-- Original forwarded message preview -->
              <div 
                v-if="message.forwarded_from" 
                class="rounded-lg p-2 mb-2 text-xs border-l-2 bg-black/5 border-current"
              >
                <p class="truncate">{{ message.forwarded_from.message || 'Shared content' }}</p>
              </div>
              
              <!-- Current message content -->
              <p v-if="message.message" class="whitespace-pre-wrap leading-relaxed">{{ message.message }}</p>
              
              <!-- Shared Post Preview -->
              <div v-if="message.shared_post || message.forwarded_from?.shared_post" class="mt-2 -mx-2 mb-1">
                <SharedPostPreview 
                    :post="message.shared_post || message.forwarded_from?.shared_post" 
                    :is-mine="message.user.id === currentUser.id"
                    @open-post="openPostModal"
                />
              </div>
              
              <!-- Timestamp & Status -->
              <div 
                class="flex items-center justify-end gap-1 mt-1 select-none"
                :class="message.user.id === currentUser.id ? 'text-zinc-400' : 'text-zinc-400'"
              >
                <span class="text-[10px] opacity-70">{{ formatTime(message.created_at) }}</span>
                <span v-if="message.user.id === currentUser.id" class="ml-0.5">
                    <Check v-if="message.read" class="w-3 h-3 text-emerald-400" />
                    <Check v-else class="w-3 h-3 opacity-60" />
                </span>
              </div>

              <!-- Hover actions menu -->
              <div 
                v-if="showActions === message.id"
                class="absolute z-10 flex items-center space-x-0.5 bg-white rounded-full shadow-lg border border-zinc-100 p-1 transition-all duration-200 animate-in fade-in zoom-in-95"
                :class="{
                  'right-0 -bottom-10': message.user.id === currentUser.id,
                  'left-0 -bottom-10': message.user.id !== currentUser.id,
                }"
                @mouseenter="showActions = message.id">
                
                <button @click.stop="handleReply(message)" class="p-1.5 text-zinc-500 hover:text-violet-600 hover:bg-violet-50 rounded-full transition-colors cursor-pointer" title="Reply">
                  <Reply class="h-4 w-4"/>
                </button>
                
                <button @click.stop="toggleEmojiPicker(message.id, $event)" @mouseenter="cancelClose()" class="p-1.5 text-zinc-500 hover:text-amber-500 hover:bg-amber-50 rounded-full transition-colors cursor-pointer" title="React">
                  <Smile class="h-4 w-4"/>
                </button>
                
                <button @click.stop="handleForward(message)" class="p-1.5 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors cursor-pointer" title="Forward">
                  <Forward class="h-4 w-4"/>
                </button>
                
                <div class="relative">
                  <button @click.stop="messageStore.toggleReportMenu()" class="p-1.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer">
                    <EllipsisVertical class="h-4 w-4"/>
                  </button>
                  <!-- Report menu dropdown -->
                  <div v-if="messageStore.showReportMenu" class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-32 bg-white rounded-xl shadow-xl border border-zinc-100 py-1 z-50 overflow-hidden" v-click-outside="() => messageStore.setShowReportMenu(false)">
                    <button @click="handleReportMessage(message.id)" class="block w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer">Report</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Reactions -->
          <div v-if="message.my_reaction_list?.length || message.other_reactions_list?.length" 
               class="flex flex-wrap items-center gap-1 mt-1 px-1"
               :class="message.user.id === currentUser.id ? 'justify-end' : 'justify-start'">
            
            <div v-for="reaction in [...(message.my_reaction_list || []), ...(message.other_reactions_list || [])]" 
                 :key="reaction.id"
                 class="bg-white border border-zinc-200 rounded-full px-1.5 py-0.5 shadow-sm flex items-center space-x-1 text-xs transform hover:scale-110 transition-transform cursor-default select-none"
                 :title="reaction.user.name">
                <span>{{ reaction.reaction }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Report Modal -->
    <ReportModal
      v-if="messageStore.isReportModalOpen"
      :is-open="messageStore.isReportModalOpen"
      :is-submitting="messageStore.isSubmittingReport"
      @close="messageStore.setIsReportModalOpen(false)"
      @submit="messageStore.submitReport"
    />

    <!-- Message Input -->
    <div class="bg-white border-t border-zinc-200 px-4 py-3 pb-safe sticky bottom-0 z-20">
      <!-- Reply Preview -->
      <div v-if="replyingTo" class="flex justify-between items-center bg-zinc-50 border border-zinc-200 rounded-xl p-3 mb-2 animate-in slide-in-from-bottom-2 fade-in">
        <div class="flex items-center space-x-3 overflow-hidden">
           <div class="w-1 h-8 bg-violet-500 rounded-full flex-shrink-0"></div>
           <div class="flex-1 min-w-0">
              <p class="text-xs font-bold text-violet-600">Replying to {{ replyingTo.user.id === currentUser.id ? 'Yourself' : replyingTo.user.name }}</p>
              <p class="text-xs text-zinc-600 truncate mt-0.5">
                {{ replyingTo.message || 'Attachment' }}
              </p>
           </div>
        </div>
        <button @click="cancelReply" class="p-1 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 transition-colors cursor-pointer">
          <X class="h-4 w-4" />
        </button>
      </div>

      <form @submit.prevent="sendMessage" class="flex items-end gap-2 relative">
        <div class="flex-1 relative">
            <textarea
                v-model="newMessage"
                placeholder="Type a message..."
                class="w-full bg-zinc-100 border-none rounded-[1.5rem] px-5 py-3 pr-12 text-sm text-zinc-900 placeholder-zinc-500 focus:ring-2 focus:ring-violet-500/20 focus:bg-white transition-all resize-none max-h-32 min-h-[46px]"
                rows="1"
                @keydown.enter.exact.prevent="sendMessage"
                style="field-sizing: content;"
            ></textarea>
        </div>
        <button
          type="submit"
          :disabled="!newMessage.trim()"
          class="bg-zinc-900 text-white rounded-full p-3 shadow-md hover:bg-violet-600 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none transition-all duration-300 flex-shrink-0 cursor-pointer"
        >
            <Send class="h-5 w-5 ml-0.5"/>
        </button>
      </form>
    </div>

    <!-- Post Detail Modal -->
    <PostDetailModal
        :is-open="isPostModalOpen"
        :post-id="viewingPost?.id"
        @close="closePostModal"
        @update:post="handlePostUpdate"
    />

    <!-- Donation Modal (for FeedItem in modal) -->
    <DonateModal
      :model-value="postStore.showDonationModal"
      @update:model-value="postStore.setShowDonationModal($event)"
      :payment-methods="postStore.selectedPost?.payment_info_list || []"
    />
    
    <!-- Connection Request Modal (for FeedItem in modal) -->
    <ConnectionRequestModal
      v-if="postStore.showConnectionRequestModal"
      :is-open="postStore.showConnectionRequestModal"
      :user-name="postStore.selectedUserForConnection?.posted_by?.name || 'this user'"
      @close="postStore.closeConnectionRequestModal()"
      @confirm="confirmConnectionRequest"
    />

    <!-- Global Emoji Picker (Teleported to Body) -->
    <Teleport to="body">
      <div 
        v-if="emojiPickerState.isOpen" 
        class="fixed z-[9999] bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95"
        :style="{
          top: `${emojiPickerState.position.top}px`,
          left: `${emojiPickerState.position.left}px`,
        }"
        v-click-outside="closeEmojiPicker"
      >
        <Picker 
          :data="emojiIndex" 
          set="twitter" 
          @select="onEmojiSelect" 
          :showPreview="false"
          :showSkinTones="false"
          :emojiSize="20"
          :native="true"
          :autoFocus="true"
        />
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ReportModal from '@/components/feed/ReportModal.vue';
import SharedPostPreview from '@/components/chat/SharedPostPreview.vue';
import PostDetailModal from '@/components/feed/PostDetailModal.vue';
import DonateModal from '@/components/feed/DonateModal.vue';
import ConnectionRequestModal from '@/components/feed/ConnectionRequestModal.vue';
import { useUserStore } from '@/stores/user';
import { usePostStore } from '@/stores/post';
import { useMessageStore } from '@/stores/message';
import { X, Reply, Smile, EllipsisVertical, Send, ArrowLeft, MessageCircle, Forward, Check, ArrowDown, AlertTriangle } from 'lucide-vue-next';
import { message } from 'ant-design-vue';

// Click outside directive logic
const vClickOutside = {
  beforeMount(el, binding) {
    el.clickOutsideEvent = function(event) {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event);
      }
    };
    document.addEventListener('click', el.clickOutsideEvent);
  },
  unmounted(el) {
    document.removeEventListener('click', el.clickOutsideEvent);
  },
};

// Emoji Picker
import data from 'emoji-mart-vue-fast/data/all.json';
import 'emoji-mart-vue-fast/css/emoji-mart.css';
import { Picker, EmojiIndex } from 'emoji-mart-vue-fast/src';

const emojiIndex = new EmojiIndex(data);

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const messageStore = useMessageStore();
const postStore = usePostStore();
const currentUser = computed(() => userStore.user);

const conversation = ref({});
const messages = ref([]);
const newMessage = ref('');
const messagesContainer = ref(null);
const replyingTo = ref(null);
const highlightedMessageId = ref(null);
const showActions = ref(null);
const pagination = ref({ next: null, previous: null, count: 0, isLoading: false });
let closeTimeout = null;

// Viewing Post Modal State
const viewingPost = ref(null);
const isPostModalOpen = ref(false);


const openPostModal = (post) => {
    if(!post) return;
    viewingPost.value = post;
    isPostModalOpen.value = true;
};

const closePostModal = () => {
    isPostModalOpen.value = false;
    viewingPost.value = null;
};

const handlePostUpdate = (updatedPost) => {
    viewingPost.value = updatedPost;
};
const confirmConnectionRequest = async (messageText) => {
    await postStore.confirmConnectionRequest(messageText);
};

// Emoji Picker State
const emojiPickerState = ref({
  isOpen: false,
  messageId: null,
  position: { top: 0, left: 0 }
});

const visibleMessages = ref([]);
let visibilityObserver = null;
let mutationObserver = null;
const showNewMessagesIndicator = ref(false);
const showNewMessageDivider = ref(false);
const firstNewMessageIndex = ref(-1);
const isAtBottom = ref(true);
const newMessagesCount = ref(0);
const hasSentNewMessage = ref(false);
const loadingMessages = ref(false);

const handleReportMessage = (messageId) => {
  messageStore.setSelectedMessageId(messageId);
  messageStore.setShowReportMenu(false);
  messageStore.setIsReportModalOpen(true);
};

const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const goToProfile = () => {
    if (otherUser.value?.username) {
        router.push({ name: 'UsernameProfile', params: { username: otherUser.value.username } });
    }
}

// Fetch conversation details
const fetchConversation = async () => {
  try {
    const response = await messageStore.fetchConversationById(route.params.id);
    conversation.value = response.data;
    await fetchMessages();
  } catch (error) {
    console.error('Error fetching conversation:', error);
  }
};

// Fetch messages
const fetchMessages = async (loadMore = false) => {
  try {
    pagination.value.isLoading = true;
    let url = `chat/conversations/${route.params.id}/messages/`;
    
    if (loadMore && pagination.value.next) {
      url = pagination.value.next;
    }
    
    const response = await messageStore.fetchMessagesByURL(url);
    const container = messagesContainer.value;
    const prevBehavior = container ? container.style.scrollBehavior : 'auto';
    if(container) container.style.scrollBehavior = 'auto';
    const previousScrollHeight = container ? container.scrollHeight : 0;
    
    if (loadMore) {
      messages.value = [...response.data.results.reverse(), ...messages.value];
    } else {
      messages.value = response.data.results.reverse();
    }
    
    pagination.value = {
      next: response.data.next,
      previous: response.data.previous,
      count: response.data.count,
      isLoading: false
    };
    
    if (loadMore && container && messages.value.length > 0) {
      nextTick(() => {
        const newScrollHeight = container.scrollHeight;
        container.scrollTop += newScrollHeight - previousScrollHeight;
        container.style.scrollBehavior = prevBehavior;
      });
    } else if (!loadMore) {
      scrollToBottom();
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    pagination.value.isLoading = false;
  }
};

// Send a new message
const sendMessage = async () => {
  if (!newMessage.value.trim()) return;

  try {
    await messageStore.sendMessage(newMessage.value, route.params.id, replyingTo.value?.id)
    newMessage.value = '';
    replyingTo.value = null;
    hasSentNewMessage.value = true;
    nextTick(() => {
      if(messages.value.length == 0) {
        fetchMessages();
      }
    });
  } catch (error) {
    message.error(error.response.data.error)
    console.error('Error sending message:', error);
  }
};

// Handle reply to message
const handleReply = (message) => {
  replyingTo.value = message;
  scrollToMessage(message.id);
  nextTick(() => {
    const textarea = document.querySelector('textarea');
    if (textarea) textarea.focus();
  });
};

const handleForward = async (message_data) => {
  try{
    await messageStore.forwardMessage(message_data.id);
    message.success("Message forwarded");
  } catch(error){
    message.error(error.response.data.error)
    console.error('Error forwarding message:', error);
  }
}

// Scroll to and highlight a specific message
const scrollToMessage = async (messageId) => {
  const messageExists = messages.value.some(msg => msg.id === messageId);
  if (!messageExists) {
    try {
      const response = await messageStore.getBulkMessages(messageId);
      if (response.data.length > 0) {
        messages.value.unshift(response.data[0]);
        if (firstNewMessageIndex.value !== -1) {
          firstNewMessageIndex.value += 1;
        }
      }
    } catch (error) {
      console.error('Error fetching message:', error);
      return;
    }
  }

  await nextTick();
  const element = document.getElementById(`message-${messageId}`);
  if (element) {
    highlightedMessageId.value = messageId;
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      highlightedMessageId.value = null;
    }, 2000);
  }
};

// Toggle emoji picker with smart positioning
const toggleEmojiPicker = (messageId, event) => {
  event.stopPropagation();
  event.preventDefault();
  
  if (emojiPickerState.value.isOpen && emojiPickerState.value.messageId === messageId) {
    closeEmojiPicker();
    return;
  }
  
  showActions.value = messageId; // Keep actions visible while picking
  
  // Calculate Position
  const button = event.currentTarget;
  const rect = button.getBoundingClientRect();
  const pickerHeight = 430; // Approx height of picker
  const pickerWidth = 350; // Approx width
  const windowHeight = window.innerHeight;
  const windowWidth = window.innerWidth;
  
  let top = rect.top;
  let left = rect.left;
  
  // Center vertically relative to button if possible, otherwise clamp to viewport
  // Check space below
  if (top + pickerHeight > windowHeight - 20) {
      // Not enough space below, try above
      top = rect.bottom - pickerHeight;
      // If still overlapping top edge
      if (top < 20) {
          // Center on screen
          top = (windowHeight - pickerHeight) / 2;
      }
  } else {
      // Align top with button top if space permits
      // Or just slightly below button
      top = rect.top; 
  }
  
  // Horizontal logic: prefer to the right of the button, or left if no space
  if (left + pickerWidth > windowWidth - 20) {
      left = windowWidth - pickerWidth - 20;
  } else {
      left = rect.left;
  }
  
  // Ensure valid values
  top = Math.max(10, Math.min(top, windowHeight - pickerHeight - 10));
  left = Math.max(10, Math.min(left, windowWidth - pickerWidth - 10));

  emojiPickerState.value = {
    isOpen: true,
    messageId: messageId,
    position: { top, left }
  };
};

const closeEmojiPicker = () => {
  emojiPickerState.value.isOpen = false;
  emojiPickerState.value.messageId = null;
  // If we closed picker, we can also let the actions menu hide naturally via mouseleave logic
  // showActions.value = null; // Optional: close actions too
};

const handleMouseLeave = () => {
  // Delay closing actions to allow moving mouse to picker?
  // Since picker is global and teleported, hovering it won't keep 'showActions' alive via CSS hover.
  // But we set 'showActions = message.id' in toggle. 
  // We can use a timeout to close actions if picker is NOT open.
  if (!emojiPickerState.value.isOpen) {
      closeTimeout = setTimeout(() => {
        showActions.value = null;
      }, 500);
  }
};

const cancelClose = () => {
  if (closeTimeout) {
    clearTimeout(closeTimeout);
    closeTimeout = null;
  }
};

// Handle emoji selection
const onEmojiSelect = async (emoji) => {
  const msgId = emojiPickerState.value.messageId;
  if (!msgId) return;

  try {
    const response = await messageStore.reactToMessage(msgId, emoji.native)
    const updatedMessage = response.data;
    const messageIndex = messages.value.findIndex(m => m.id === updatedMessage.id);
    
    if (messageIndex !== -1) {
      const updatedMessages = [...messages.value];
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        my_reaction_list: updatedMessage.my_reaction_list,
        other_reactions_list: updatedMessage.other_reactions_list,
        updated_at: updatedMessage.updated_at
      };
      messages.value = updatedMessages;
    }
    closeEmojiPicker();
    showActions.value = null;
  } catch (error) {
    console.error('Error sending reaction:', error);
    message.error(error.response.data.error)
  }
};

const cancelReply = () => {
  replyingTo.value = null;
};

const scrollToNewMessages = () => {
  if (firstNewMessageIndex.value >= 0) {
    const firstNewMsgId = messages.value[firstNewMessageIndex.value].id;
    let element = document.getElementById(`message-${firstNewMsgId - 1}`) || document.getElementById(`message-${firstNewMsgId}`);   
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    showNewMessagesIndicator.value = false;
  } else {
    scrollToBottom();
  }
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    showNewMessagesIndicator.value = false;
    setTimeout(() => {
      showNewMessageDivider.value = false;
    }, 3000);
    isAtBottom.value = true;
    newMessagesCount.value = 0;
  }
};

const otherUser = computed(() => {
  if (!conversation.value.other_user_list) return null;
  return conversation.value.other_user_list.find(
    member => member.user.id !== currentUser.value.id
  )?.user;
});

// Observation logic for messages
function observeMessageVisibility() {
  if (visibilityObserver) visibilityObserver.disconnect();

  visibilityObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = entry.target.id.replace("message-", "");
        const index = visibleMessages.value.indexOf(id);

        if (entry.isIntersecting) {
          if (index === -1) visibleMessages.value.push(id);
        } else {
          if (index !== -1) visibleMessages.value.splice(index, 1);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll("[id^='message-']").forEach((el) => {
    visibilityObserver.observe(el);
  });

  if (!mutationObserver) {
    const container = document.querySelector(".messages-container");
    if (!container) return;

    mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.id?.startsWith("message-")) {
            visibilityObserver.observe(node);
          }
        });
      });
    });
    mutationObserver.observe(container, { childList: true, subtree: true });
  }
}

let visibleMessagesInterval = null;
const fetchVisibleMessages = async () => {
  if (!visibleMessages.value.length) return;
  try {
    const ids = visibleMessages.value.join(',');
    const response = await messageStore.getBulkMessages(ids);
    const fetchedMessages = response.data;
    fetchedMessages.forEach(fetchedMsg => {
      const index = messages.value.findIndex(m => m.id === fetchedMsg.id);
      if (index !== -1) {
        messages.value[index] = { ...messages.value[index], ...fetchedMsg };
      }
    });
  } catch (error) {
    console.error('Error fetching visible messages:', error);
  }
};

const startVisibleMessagesPolling = () => {
  if (visibleMessagesInterval) clearInterval(visibleMessagesInterval);
  visibleMessagesInterval = setInterval(fetchVisibleMessages, 3000);
};

const stopVisibleMessagesPolling = () => {
  if (visibleMessagesInterval) clearInterval(visibleMessagesInterval);
};

let newMessagesInterval = null;
const handleScroll = () => {
  if (!messagesContainer.value) return;
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value;
  const isBottom = scrollHeight - (scrollTop + clientHeight) < 100;
  
  isAtBottom.value = isBottom;
  if (isBottom) {
    showNewMessagesIndicator.value = false;
    setTimeout(() => {
      showNewMessageDivider.value = false;
    }, 3000);
    newMessagesCount.value = 0;
  }
};

const fetchNewMessages = async () => {
  if (!messages.value.length) return;
  const latestId = messages.value[messages.value.length - 1].id;
  try {
    const response = await messageStore.getMessagesAfterId(route.params.id, latestId);
    const newMsgs = response.data.results;

    if (newMsgs.length) {
      const prevLength = messages.value.length;
      messages.value = [...messages.value, ...newMsgs];
      
      if (firstNewMessageIndex.value === -1 || isAtBottom.value) {
        firstNewMessageIndex.value = prevLength;
        showNewMessageDivider.value = true;
      } else {
        showNewMessageDivider.value = true;
      }

      if(hasSentNewMessage.value && newMsgs.some(msg => msg.user.id === currentUser.value.id)){
        hasSentNewMessage.value = false;
        nextTick(() => { scrollToBottom(); });
        showNewMessageDivider.value = false;
      } else if (!isAtBottom.value) {
        showNewMessagesIndicator.value = true;
        newMessagesCount.value += newMsgs.length;
      } else {
        scrollToNewMessages();
      }
    }
  } catch (error) {
    console.error("Error fetching new messages:", error);
  }
};

const startNewMessagesPolling = () => {
  if (newMessagesInterval) clearInterval(newMessagesInterval);
  newMessagesInterval = setInterval(fetchNewMessages, 1000);
};

const stopNewMessagesPolling = () => {
  if (newMessagesInterval) clearInterval(newMessagesInterval);
};

watch(
  () => route.params.id,
  async (newId, oldId) => {
    if (!newId || newId === oldId) return;

    // Reset state
    isPostModalOpen.value=false;
    messages.value = [];
    conversation.value = {};
    pagination.value = { next: null, previous: null, count: 0, isLoading: false };
    firstNewMessageIndex.value = -1;
    showNewMessagesIndicator.value = false;
    newMessagesCount.value = 0;

    // Cleanup previous chat
    unmount_chat();

    // Initialize new chat
    await initialize_chat();
  }
);

const initialize_chat = async () => {
  loadingMessages.value = true
  await fetchConversation();
  loadingMessages.value = false
  scrollToBottom();
  observeMessageVisibility();
  startVisibleMessagesPolling();
  startNewMessagesPolling();
  if (messagesContainer.value) {
    messagesContainer.value.addEventListener('scroll', handleScroll);
  }
}

const unmount_chat = () => {
  stopVisibleMessagesPolling();
  stopNewMessagesPolling();
  if (messagesContainer.value) {
    messagesContainer.value.removeEventListener('scroll', handleScroll);
  }
}
onMounted(async () => {
  await initialize_chat();
});

onUnmounted(() => {
  unmount_chat();
});
</script>
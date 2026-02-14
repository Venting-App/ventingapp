<template>
  <Dialog :open="show" @close="$emit('close')" class="relative z-50">
    <!-- The backdrop -->
    <div class="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm transition-opacity" aria-hidden="true" />

    <!-- Full-screen container to center the panel -->
    <div class="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
      <DialogPanel class="w-full max-w-md max-h-[85vh] overflow-hidden bg-white rounded-2xl flex flex-col shadow-2xl border border-zinc-100 transform transition-all">
        <div class="p-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <div>
              <DialogTitle class="text-xl font-bold text-zinc-900">Connection Requests</DialogTitle>
              <p class="text-sm text-zinc-500 mt-0.5">Manage your incoming requests</p>
          </div>
          <button 
            @click="$emit('close')" 
            class="text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full p-1 transition-all cursor-pointer focus:outline-none"
          >
            <span class="sr-only">Close</span>
            <X :size="24" aria-hidden="true" />
          </button>
        </div>
        
        <div class="overflow-y-auto flex-1 p-5">
          <div v-if="loadingConnections" class="flex flex-col items-center justify-center py-12">
            <Loader2 class="w-8 h-8 animate-spin text-violet-600 mb-2" />
            <span class="text-sm text-zinc-500">Loading requests...</span>
          </div>
          
          <div v-else-if="connections.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
             <div class="w-14 h-14 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-zinc-300"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="25" y2="8"></line><line x1="22" y1="5" x2="22" y2="11"></line></svg>
             </div>
             <p class="text-zinc-600 font-semibold text-lg">No pending requests.</p>
             <p class="text-zinc-500 text-sm mt-1">Check back later for new connections.</p>
          </div>
          
          <div v-else class="space-y-4">
            <div v-for="connection in connections" :key="connection.id" class="border border-zinc-200 rounded-xl p-5 bg-white hover:border-violet-200 hover:shadow-sm transition-all duration-200">
              <div class="flex items-center space-x-4 mb-4">
                <div v-if="connection.initiating_user.profile_picture" class="h-12 w-12 rounded-full overflow-hidden ring-2 ring-zinc-50">
                  <img :src="connection.initiating_user.profile_picture" :alt="connection.initiating_user.name" class="h-full w-full object-cover">
                </div>
                <div v-else class="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 font-bold text-base ring-2 ring-zinc-50">
                  {{ connection.initiating_user.name?.charAt(0).toUpperCase() || 'U' }}
                </div>
                <div>
                  <div>
                    <p class="font-bold text-zinc-900 text-base">{{ connection.initiating_user.name }}</p>
                    <p class="text-sm text-zinc-500 font-medium">@{{ connection.initiating_user.username }}</p>
                  </div>
                </div>
              </div>
              
              <!-- Connection message if exists -->
              <div v-if="connection.message" class="mt-2 mb-4 p-4 bg-zinc-50 rounded-xl text-base text-zinc-700 border border-zinc-100">
                <div class="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-zinc-400 mt-1 mr-2.5 flex-shrink-0"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    <p class="whitespace-pre-line text-zinc-700 leading-relaxed">{{ connection.message }}</p>
                </div>
              </div>

              <div v-if="connection.reconnection_requested_by === userStore.user?.id" class="mt-2 text-sm text-zinc-600 flex items-center bg-amber-50 text-amber-800 px-4 py-3 rounded-xl border border-amber-100">
                <Loader2 class="w-4 h-4 animate-spin mr-2.5" />
                <span class="font-medium">Waiting for approval since {{ connection.formatted_updated_at }}</span>
              </div>
              
              <div v-else class="mt-1">
                <div v-if="!connection.reconnection_rejected" class="flex space-x-3 mt-4">
                  <button 
                    @click="handleAcceptConnection(connection)"
                    class="flex-1 flex items-center justify-center px-4 py-2.5 bg-zinc-900 text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 shadow-sm hover:shadow-md transition-all cursor-pointer"
                    :disabled="connectionStore.processingAction"
                  >
                    <Check v-if="!connectionStore.processingAction" :size="18" class="mr-2" />
                    <Loader2 v-else class="w-4 h-4 animate-spin mr-2" />
                    Accept
                  </button>
                  <button 
                    @click="handleRejectConnection(connection)"
                    class="flex-1 flex items-center justify-center px-4 py-2.5 bg-white border border-zinc-200 text-zinc-700 text-sm font-semibold rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all cursor-pointer"
                    :disabled="connectionStore.processingAction"
                  >
                    <X v-if="!connectionStore.processingAction" :size="18" class="mr-2" />
                    <Loader2 v-else class="w-4 h-4 animate-spin mr-2" />
                    Reject
                  </button>
                </div>
                <div v-else class="bg-rose-50 text-rose-700 px-4 py-3 rounded-xl text-sm font-medium mt-3 flex items-center justify-center border border-rose-100">
                  <X :size="16" class="mr-2" />
                  Connection rejected
                </div>
                 <p class="text-xs text-zinc-400 text-right mt-3 font-medium">Requested {{ connection.formatted_created_at }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="p-5 border-t border-zinc-100 bg-zinc-50/50">
          <button 
            @click="$emit('close')" 
            class="w-full py-3 px-4 bg-white border border-zinc-300 text-zinc-700 font-semibold text-sm rounded-full hover:bg-zinc-50 hover:text-zinc-900 transition-colors cursor-pointer shadow-sm"
          >
            Close
          </button>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>
<script setup>
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue';
import { Loader2, Check, X } from 'lucide-vue-next';
import { useUserStore } from '@/stores/user';
import { useConnectionStore } from '@/stores/connection';
import { usePostStore } from '@/stores/post';
import { nextTick } from 'vue';
const connectionStore = useConnectionStore();
const userStore = useUserStore();
const postStore = usePostStore();
const props = defineProps({
    show: {
        type: Boolean,
        required: true
    },
    post_id: {
        type: [String, Number],
        required: true
    },
    connections: {
        type: Array,
        required: true
    },
    loadingConnections: {
        type: Boolean,
        required: true
    }
})

const emit = defineEmits(['close'])

const handleAcceptConnection = async (connection) => {
    const success = await connectionStore.handleAcceptConnection(connection);
    if(success) {
      postStore.updatePostFromBackend(props.post_id);
      nextTick(() => {
          emit('close');
      });
    }
}

const handleRejectConnection = async (connection) => {
    const success = await connectionStore.handleRejectConnection(connection);
    if(success) {
      postStore.updatePostFromBackend(props.post_id);
      nextTick(() => {
          emit('close');
      });
    }
}
</script>
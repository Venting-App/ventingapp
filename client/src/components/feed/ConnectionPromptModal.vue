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
            <DialogPanel class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-2xl transition-all border border-zinc-100">
              <div class="text-center">
                <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 mb-4 ring-8 ring-violet-50">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                
                <DialogTitle as="h3" class="text-xl font-bold leading-6 text-zinc-900 mb-2">
                  Connect with {{ userName }}
                </DialogTitle>
          
          <div class="mt-3">
            <p class="text-sm text-zinc-500 leading-relaxed px-2">
              <template v-if="!isPending && !isRejected">
                <span v-if="purpose == 'donate'">To support {{ userName }} with a donation, you'll need to connect first.</span>
                <span v-else-if="purpose == 'chat'">Start a conversation by connecting with {{ userName }}.</span>
                <span v-else>Connect with {{ userName }} to interact more.</span>
              </template>
              <template v-else>
                <span v-if="purpose == 'donate'">
                  Your connection request to {{ userName }} is pending. Once accepted, you can proceed with your donation.
                </span>
                <span v-else-if="purpose == 'chat'">
                   Your connection request to {{ userName }} is pending. Chat will be available once accepted.
                </span>
                <span v-else>
                  Your connection request to {{ userName }} is pending. Please wait for their approval.
                </span>
              </template>
            </p>
            
            <div v-if="!isPending && !isRejected" class="mt-4 bg-amber-50 rounded-lg p-3 border border-amber-100">
               <div class="flex items-center justify-center text-xs font-medium text-amber-800">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                  </svg>
                  Cost: 1 Connect
               </div>
            </div>
          </div>

          <div class="mt-6 flex flex-col space-y-3">
            <button
              v-if="!isPending && !isRejected"
              type="button"
              class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-full shadow-lg shadow-violet-500/20 text-sm font-semibold text-white bg-zinc-900 hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-all cursor-pointer"
              @click="handleConnect"
              :disabled="loading"
            >
              <Loader2 v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
              {{ loading ? 'Connecting...' : 'Connect Now' }}
            </button>
            
            <button
              type="button"
              class="w-full flex justify-center py-2.5 px-4 border border-zinc-300 rounded-full shadow-sm text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-50 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 transition-colors cursor-pointer"
              @click="$emit('close')"
              :disabled="loading"
            >
              {{ isPending || isRejected ? 'Close' : 'Cancel' }}
            </button>
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
import { ref } from 'vue';
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue';
import { Loader2 } from 'lucide-vue-next';

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  purpose: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  isPending: {
    type: Boolean,
    default: false
  },
  isRejected: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['connect', 'close']);
const loading = ref(false);

const closeModal = () => {
  emit('close');
};

const handleConnect = async () => {
  try {
    loading.value = true;
    await emit('connect');
  } finally {
    loading.value = false;
  }
};
</script>

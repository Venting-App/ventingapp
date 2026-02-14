<template>
  <TransitionRoot appear :show="modelValue" as="template">
    <Dialog as="div" class="relative z-50" @close="close">
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
              <div class="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/30">
                <div>
                  <DialogTitle as="h3" class="text-lg font-bold text-zinc-900">Support this Creator</DialogTitle>
                  <p class="text-xs text-zinc-500 mt-0.5">Choose a method to send your donation</p>
                </div>
                <button @click="close" class="p-2 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-all cursor-pointer">
                  <X class="h-5 w-5" />
                </button>
              </div>
              
              <div class="max-h-[60vh] overflow-y-auto p-4 space-y-3">
                <div v-for="(method, index) in paymentMethods" :key="index" class="rounded-xl border border-zinc-200 overflow-hidden transition-all duration-300" :class="activeIndex === index ? 'shadow-md border-violet-200 bg-white' : 'bg-white hover:border-violet-200 hover:bg-zinc-50'">
                  <button 
                    @click="toggleAccordion(index)"
                    class="w-full flex justify-between items-center text-left p-4 cursor-pointer focus:outline-none"
                  >
                    <span class="font-semibold text-zinc-800" :class="activeIndex === index ? 'text-violet-700' : ''">{{ method.method }}</span>
                    <div class="rounded-full p-1 transition-colors" :class="activeIndex === index ? 'bg-violet-100 text-violet-600' : 'text-zinc-400'">
                       <ChevronDown v-if="activeIndex != index" class="h-5 w-5" />
                       <ChevronUp v-else class="h-5 w-5" />
                    </div>
                  </button>
                  
                  <div v-if="activeIndex === index" class="px-4 pb-4 pt-0 space-y-3">
                    <div class="h-px w-full bg-zinc-100 mb-3"></div>
                    
                    <div @click="copyToClipboard(method.account)" class="group bg-zinc-50 border border-zinc-100 p-3 rounded-lg flex justify-between items-center cursor-pointer hover:border-violet-200 transition-all">
                      <div>
                        <p class="text-[10px] uppercase tracking-wide font-semibold text-zinc-400">Account Number</p>
                        <p class="font-mono text-sm font-medium text-zinc-800 mt-0.5">{{ method.account }}</p>
                      </div>
                      <button 
                        class="text-zinc-400 group-hover:text-violet-600 bg-white p-2 rounded-md shadow-sm border border-zinc-100 group-hover:border-violet-100 transition-all"
                        title="Copy to clipboard"
                      >
                        <ClipboardCopy class="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div @click="copyToClipboard(method.nameOnAccount)" v-if="method.nameOnAccount" class="group bg-zinc-50 border border-zinc-100 p-3 rounded-lg flex justify-between items-center cursor-pointer hover:border-violet-200 transition-all">
                      <div>
                        <p class="text-[10px] uppercase tracking-wide font-semibold text-zinc-400">Account Name</p>
                        <p class="text-sm font-medium text-zinc-800 mt-0.5">{{ method.nameOnAccount }}</p>
                      </div>
                      <button 
                        class="text-zinc-400 group-hover:text-violet-600 bg-white p-2 rounded-md shadow-sm border border-zinc-100 group-hover:border-violet-100 transition-all"
                        title="Copy to clipboard"
                      >
                        <ClipboardCopy class="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div v-if="paymentMethods.length === 0" class="text-center py-8">
                    <p class="text-zinc-500 text-sm">No payment methods listed.</p>
                </div>
              </div>
              
              <div class="p-4 bg-zinc-50 border-t border-zinc-100">
                <p class="text-xs text-zinc-400 text-center font-medium">Your support means a lot to the community.</p>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue';
import { ChevronDown, ChevronUp, ClipboardCopy, X } from 'lucide-vue-next';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  paymentMethods: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:modelValue']);

const activeIndex = ref(0);

// Watch for changes to the modelValue prop
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    activeIndex.value = 0; // Reset to first payment method when opening
  }
});

const toggleAccordion = (index) => {
  activeIndex.value = activeIndex.value === index ? null : index;
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    message.success('Copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy:', err);
    message.error('Failed to copy to clipboard');
  }
};

const close = () => {
  emit('update:modelValue', false);
};
</script>
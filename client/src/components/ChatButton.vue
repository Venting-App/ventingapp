<template>
    <button 
        @click="$emit('chat-click')"
        class="h-8 w-8 flex items-center justify-center text-zinc-400 hover:text-violet-600 hover:bg-violet-50 rounded-full transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-transparent hover:border-violet-100"
        title="Chat"
    >
        <Send class="w-4 h-4 stroke-[2.5] ml-0.5" />
    </button>
</template>
<script setup>
import { Send } from 'lucide-vue-next';

const props = defineProps({
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

</script>
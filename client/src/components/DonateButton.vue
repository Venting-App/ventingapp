<template>
    <button 
        v-if="post.payment_info_list && post.payment_info_list.length > 0"
        @click="$emit('donate-click')"
        class="h-8 px-3.5 bg-zinc-900 hover:bg-violet-600 text-white text-xs font-semibold rounded-full shadow-sm hover:shadow hover:-translate-y-0.5 transition-all duration-300 flex items-center cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none ml-1"
        :disabled="processingDonation"
    >
        <Loader2 v-if="processingDonation" class="w-3 h-3 mr-1.5 animate-spin" />
        <span v-else-if="!showIcon">Support</span>
        <HandHelping v-else :size="16" class="stroke-[2.5] text-white-600" />
    </button>
</template>
<script setup>
import { Loader2, HandHelping } from 'lucide-vue-next';

const props = defineProps({
    showIcon: {
        type: Boolean,
        required: false,
        default: false
    },
    processingDonation: {
        type: Boolean,
        required: true,
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
</script>
<template>
    <button 
        @click="$emit('follow-click')"
        class="h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200 border"
        :class="{
            'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100': post.connected,
            'bg-amber-50 text-amber-600 border-amber-100': post.pending_connection && !post.rejected_connection,
            'bg-rose-50 text-rose-600 border-rose-100': post.rejected_connection,
            'bg-white text-zinc-400 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-600 hover:border-zinc-300': (!post.connected && !post.pending_connection && !post.rejected_connection) || (post.removed_connection && !post.pending_connection),
            'cursor-not-allowed opacity-75': post.rejected_connection || post.banned_connection,
            'cursor-pointer': !post.rejected_connection && !post.banned_connection
        }"
        :disabled="post.rejected_connection || post.banned_connection"
        :title="getFollowButtonTooltip(post)"
    >
        <template v-if="post.connected">
            <UserCheck :size="16" class="stroke-[2.5]" />
        </template>
        <template v-else-if="post.pending_connection">
            <Clock :size="16" class="stroke-[2.5]" />
        </template>
        <template v-else-if="post.banned_connection">
            <UserX :size="16" class="stroke-[2.5]" />
        </template>
        <template v-else-if="post.rejected_connection">
            <UserX :size="16" class="stroke-[2.5] text-red-600" />
        </template>
        <UserPlus v-else :size="16" class="stroke-[2.5]" />
    </button>
</template>
<script setup>
import { UserPlus, UserCheck, Clock, UserX } from 'lucide-vue-next';

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


const getFollowButtonTooltip = (post) => {
  if (post.connected) return 'Connected';
  if (post.pending_connection) return 'Connection Pending';
  if (post.rejected_connection) return 'Connection Rejected';
  return 'Follow User';
};
</script>
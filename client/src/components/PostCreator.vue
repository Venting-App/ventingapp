<template>
    <router-link 
    :to="{ name: 'UsernameProfile', params: { username: post.posted_by.username } }"
    class="flex flex-1 items-center space-x-3 group/user"
    >
    <div v-if="post.posted_by?.profile_picture" class="h-10 w-10 rounded-full overflow-hidden ring-2 ring-zinc-50 group-hover/user:ring-violet-100 transition-all">
        <img 
        :src="post.posted_by.profile_picture" 
        :alt="post.posted_by.name"
        class="h-full w-full object-cover"
        />
    </div>
    <div v-else class="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 font-semibold ring-2 ring-zinc-50">
        {{ post.posted_by?.name ? post.posted_by.name.charAt(0).toUpperCase() : 'U' }}
    </div>
    <div>
    <p class="font-semibold text-zinc-800 text-[15px] leading-tight group-hover/user:text-violet-700 transition-colors">
        {{ post.posted_by?.name || 'Anonymous' }}
    </p>

    <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
        <p class="text-xs text-zinc-400 font-medium">
            @{{ post.posted_by?.username || 'user' }}
        </p>

        <span class="text-[10px] text-zinc-300">•</span>

        <span class="text-xs text-zinc-400">
            {{ post.formatted_created_at }}
        </span>
    </div>
</div>

    </router-link>
</template>
<script setup>

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
<template>
    <div>
        <!-- Donation Modal -->
        <DonateModal
            :model-value="showDonationModal"
            @update:model-value="setShowDonationModal"
            :payment-methods="selectedPost?.payment_info_list || []"
        />
        
        <!-- Connection Request Modal -->
        <ConnectionRequestModal
            v-if="showConnectionRequestModal"
            :is-open="showConnectionRequestModal"
            :user-name="selectedUserForConnection?.posted_by?.name || 'this user'"
            @close="closeConnectionRequestModal"
            @confirm="confirmConnectionRequest"
        />
        

        <!-- Connects Modal -->
        <ConnectsModal
            :is-open="isConnectsModalOpen"
            :current-connects="currentConnects"
            :connects-data="connectsStore.connectsData"
            :loading="connectsStore.isLoading"
            @close="setIsConnectsModalOpen(false)"
            @purchase="connectsStore.handlePurchaseConnects"
        />

        <ConnectionModal 
            v-if="showConnectionsModal" 
            @close="closeConnectionsModal" 
            :show="showConnectionsModal" 
            :connections="connections"
            :loadingConnections="loadingConnections"
            :post_id="selectedPost?.id"
        />
        
        <ConnectionPromptModal
            v-if="showConnectionPrompt"
            :show="showConnectionPrompt"
            :user-name="selectedPost.posted_by?.name || 'this user'"
            :is-pending="selectedPost.pending_connection"
            :is-rejected="selectedPost.rejected_connection"
            :purpose="connectionPromptPurpose"
            @connect="handleConnect(selectedPost)"
            @close="closeConnectionPrompt"
        />
        <ShareModal
            v-if="showShareModal"
            :post="selectedPost"
            :show="showShareModal"
            @close="closeShareModal"
        />
    </div>
</template>
<script setup>
import DonateModal from '@/components/feed/DonateModal.vue';
import ConnectionRequestModal from '@/components/feed/ConnectionRequestModal.vue';
import ConnectsModal from '@/components/connects/ConnectsModal.vue';
import ConnectionModal from '@/components/feed/ConnectionsModal.vue';
import ConnectionPromptModal from '@/components/feed/ConnectionPromptModal.vue';
import ShareModal from '@/components/feed/ShareModal.vue';
import { computed } from 'vue';
import { usePostStore } from '@/stores/post';
import { useOtherProfilePostStore } from '@/stores/profile';
import { useUserStore } from '@/stores/user';
import { useConnectsStore } from '@/stores/connect';
const postStore = usePostStore();
const profileStore = useOtherProfilePostStore();
const userStore = useUserStore();
const connectsStore = useConnectsStore();

const currentConnects = computed(() => userStore.user?.connects || 0);

const props = defineProps({
    user_id: {
        type: [String, Number],
        required: false
    }
})
const emit = defineEmits(['follow-click'])
const selectedPost = computed(() => props.user_id == null ? postStore.selectedPost : profileStore.selectedPost)
const connections = computed(() => props.user_id == null ? postStore.connections : profileStore.connections)
const loadingConnections = computed(() => props.user_id == null ? postStore.loadingConnections : profileStore.loadingConnections)
const showDonationModal = computed(() => props.user_id == null ? postStore.showDonationModal : profileStore.showDonationModal)
const showConnectionRequestModal = computed(() => props.user_id == null ? postStore.showConnectionRequestModal : profileStore.showConnectionRequestModal)
const showShareModal = computed(() => props.user_id == null ? postStore.showShareModal : profileStore.showShareModal)
const selectedUserForConnection = computed(() => props.user_id == null ? postStore.selectedUserForConnection : profileStore.selectedUserForConnection)
const isConnectsModalOpen = computed(() => props.user_id == null ? postStore.isConnectsModalOpen : profileStore.isConnectsModalOpen)

const connectionPromptPurpose = computed(() => props.user_id == null ? postStore.connectionPromptPurpose : profileStore.connectionPromptPurpose); 
const showConnectionPrompt = computed(() => props.user_id == null ? postStore.showConnectionPrompt : profileStore.showConnectionPrompt);

const showConnectionsModal = computed(() => props.user_id == null ? postStore.showConnectionsModal : profileStore.showConnectionsModal);



const setShowDonationModal = (value) => {
    if (props.user_id == null) {
        postStore.setShowDonationModal(value);
    } else {
        profileStore.setShowDonationModal(value);
    }
}

const closeConnectionRequestModal = () => {
    if (props.user_id == null) {
        postStore.closeConnectionRequestModal();
    } else {
        profileStore.closeConnectionRequestModal();
    }
}

const confirmConnectionRequest = async (messageText = '') => {
    if (props.user_id == null) {
        await postStore.confirmConnectionRequest(messageText);
    } else {
        await profileStore.confirmConnectionRequest(messageText);
    }
}

const setIsConnectsModalOpen = (value) => {
    if (props.user_id == null) {
        postStore.setIsConnectsModalOpen(value);
    } else {
        profileStore.setIsConnectsModalOpen(value);
    }
}

const closeConnectionsModal = () => {
    if (props.user_id == null) {
        postStore.closeConnectionsModal();
    } else {
        profileStore.closeConnectionsModal();
    }
}

const closeShareModal = () => {
    if (props.user_id == null) {
        postStore.closeShareModal();
    } else {
        profileStore.closeShareModal();
    }
}

const setProcessingDonation = (value) => {
    if (props.user_id == null) {
        postStore.setProcessingDonation(value);
    } else {
        profileStore.setProcessingDonation(value);
    } 
}

const closeConnectionPrompt = () => {
    if (props.user_id == null) {
        postStore.closeConnectionPrompt();
    } else {
        profileStore.closeConnectionPrompt();
    }
}

const handleConnect = async (post) => {
  if (!post?.posted_by?.id) return;
  
  try {
    setProcessingDonation(true);
    await emit('follow-click', post, true);
    closeConnectionPrompt();
  } catch (error) {
    console.error('Error connecting:', error);
  } finally {
    setProcessingDonation(false);
  }
};

</script>
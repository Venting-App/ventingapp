import { defineStore } from "pinia";
import { ref, computed, watch } from 'vue';
import { message } from 'ant-design-vue';
import api from '@/api/axios';

export const useOtherProfilePostStore = defineStore('otherProfilePost', () => {

    // State
    const profileId = ref(null);
    const profile = ref(null);
    const posts = ref([]);
    const postCount = ref(0);
    const loading = ref(true);
    const loadingMore = ref(false);
    const nextPage = ref(null);
    const hasNextPage = computed(() => !!nextPage.value);
    const showDonationModal = ref(false);
    const showCommentModal = ref(false);
    const showConnectionsModal = ref(false);
    const loadingConnections = ref(false);

    const showShareModal = ref(false);
    const connections = ref([]);

    const connectionPromptPurpose = ref('donate'); 
    const showConnectionPrompt = ref(false);
    const processingDonation = ref(false);

    const selectedPost = ref(null);
    const likingPostId = ref(null);
    const savingPostId = ref(null);
    const showConnectionRequestModal = ref(false);
    const showConnectionProfileModal = ref(false);
    const isConnectsModalOpen = ref(false);

    const setLoading = (value) => {
        loading.value = value;
    }

    const setIsConnectsModalOpen = (value) => {
        isConnectsModalOpen.value = value;
    }

    const setLoadingConnections = (value) => {
        loadingConnections.value = value;
    }

    const setConnections = (value) => {
        connections.value = value;
    }

    const setShowDonationModal = (value) => {
        showDonationModal.value = value;
    }

    const setShowConnectionRequestModal = (value) => {
        showConnectionRequestModal.value = value;
    }  

    const setProcessingDonation = (value) => {
        processingDonation.value = value;
    }

    const setShowConnectionProfileModal = (value) => {
        showConnectionProfileModal.value = value;
    }

    const fetchUserProfile = async (route) => {
        if (route.params.userId) {
            profileId.value = route.params.userId;
            try {            
                const response = await api.get(`/account/users/${profileId.value}/profile/`);
                profile.value = response.data;
                
            } catch (err) {
                console.error('Error fetching user profile:', err);
                message.error('Failed to load user profile. Please try again.');
            }
        } else if (route.params.username) {
            try {
                const response = await api.get(`/account/users/get_profile_by_username/`, {
                    params: {
                        username: route.params.username
                    }
                });
                profile.value = response.data;
                profileId.value = response.data?.id;
            } catch (err) {
                console.error('Error fetching user profile:', err);
                if (err.response?.data?.error) {
                    message.error(err.response.data.error);
                } else {
                    message.error('Failed to load user profile. Please try again.');
                }
            }
        }
    };

    const fetchUserPosts = async (url = null) => {
        try {
            const endpoint = url || `/post/posts/other_user_posts/?user=${profileId.value}`;
            const response = await api.get(endpoint);
            postCount.value = response.data.count;
            if (url) {
                posts.value = [...posts.value, ...response.data.results];
            } else {
                posts.value = response.data.results;
            }
            nextPage.value = response.data.next;
        } catch (err) {
            console.error('Error fetching user posts:', err);
            message.error('Failed to load user posts. Please try again.');
        } finally {
            loading.value = false;
            loadingMore.value = false;
        }
    };



    const visiblePosts = ref([]);
    let visibilityObserver = null;
    let mutationObserver = null;

    const handleUpdatePostObj = (post) => {
        const index = posts.value.findIndex(p => p.id === post.id);
        if (index !== -1) {
            posts.value[index] = post;
        }
    }

    const loadMore = () => {
        if (nextPage.value && !loadingMore.value) {
            loadingMore.value = true;

            const url = new URL(nextPage.value, window.location.origin);
            // Remove the first path segment
            const segments = url.pathname.split('/').filter(Boolean); // ["api", "post", "posts"]
            const relativePath = '/' + segments.slice(1).join('/') + url.search; // "/post/posts/?page=2"

            fetchUserPosts(relativePath);
        }
    };


    const handleChat = async (post, router) => {
        try {
            // If connected, start a chat
            const chatResponse = await api.post('chat/conversations/chat_with_user/', {
            user_id: post.posted_by.id
            });
            
            // Navigate to the chat
            const conversation = chatResponse.data[0]; // The API returns an array with one conversation
            router.push(`/chat/${conversation.id}`);
        } catch (error) {
            console.error('Error starting chat:', error);
            // Show error message to user
            if (error.response?.data?.error) {
            alert(error.response.data.error);
            } else {
            alert('Failed to start chat. Please try again.');
            }
        }
    };

    const openDonationModal = (post) => {
        selectedPost.value = post;
        showDonationModal.value = true;
    };


    const openShareModal = (post) => {
        selectedPost.value = post;
        showShareModal.value = true;
    };
    const closeShareModal = () => {
        showShareModal.value = false;
    };

    const openCommentModal = (post) => {
        selectedPost.value = post;
        showCommentModal.value = true;
    };

    const closeCommentModal = () => {
        showCommentModal.value = false;
    };

    const openConnectionPrompt = (post) => {
        selectedPost.value = post;
        showConnectionPrompt.value = true;
    };
    const setConnectionPromptPurpose = (purpose) => {
        connectionPromptPurpose.value = purpose;
    };
    const closeConnectionPrompt = async () => {
        showConnectionPrompt.value = false;
    }

    const closeDonationModal = async (connected = false) => {
        if (connected && selectedPost.value) {
            // If user just connected, start a chat
            await handleChat(selectedPost.value);
        }
        showDonationModal.value = false;
    };


    const handleLike = async (post) => {
        try {
            likingPostId.value = post.id;
            const endpoint = post.liked ? 'unlike' : 'like';
            const response = await api.post(`/post/posts/${post.id}/${endpoint}/`);
            
            // Update the post in the posts array
            const index = posts.value.findIndex(p => p.id === post.id);
            if (index !== -1) {
            // Create a new array to trigger reactivity
            const updatedPosts = [...posts.value];
            updatedPosts[index] = {
                ...updatedPosts[index],
                liked: !post.liked,
                likes: response.data.likes
            };
            posts.value = updatedPosts;
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            message.error('Failed to update like. Please try again.');
        } finally {
            likingPostId.value = null;
        }
    };

    const handleSave = async (post) => {
        try {
            savingPostId.value = post.id;
            const endpoint = post.saved ? 'unsave' : 'save';
            const response = await api.post(`/post/posts/${post.id}/${endpoint}/`);
            
            // Update the post in the posts array
            const index = posts.value.findIndex(p => p.id === post.id);
            if (index !== -1) {
            // Create a new array to trigger reactivity
            const updatedPosts = [...posts.value];
            updatedPosts[index] = {
                ...updatedPosts[index],
                saved: !post.saved,
                saves: response.data.saves
            };
            posts.value = updatedPosts;
            }
        } catch (error) {
            console.error('Error toggling save:', error);
            message.error('Failed to update save status. Please try again.');
        } finally {
            savingPostId.value = null;
        }
    };

    const openConnectionsModal = (post) => {
        selectedPost.value = post;
        showConnectionsModal.value = true;
    };

    const closeConnectionsModal = () => {
        showConnectionsModal.value = false;
    };

    const closeConnectionRequestModal = () => {
        showConnectionRequestModal.value = false;
    };
    const closeConnectionProfileModal = () => {
        showConnectionProfileModal.value = false;
    };

    const confirmConnectionRequest = async (messageText = '') => {
        
        closeConnectionRequestModal();
        closeConnectionProfileModal();
        
        try {

            profile.value.pending_connection = true;
            
            const response = await api.post(`/account/users/${profile.value.id}/connect/`, {
            message: messageText
            });
            
            if (response.status === 201) {
                // Connection was just established (201 Created)
                profile.value.connected = true;
                profile.value.pending_connection = false;
                profile.value.removed_connection = false;
                message.success(`You are now following ${profile.value.name || 'this user'}`);
            } else if (response.status === 200) {
                // Connection request sent
                profile.value.pending_connection = true;
                profile.value.removed_connection = false;
                message.success('Connection request sent');
            }
        } catch (error) {
            console.error('Error sending connection request:', error);
            
            profile.value.pending_connection = false;
            
            let errorMessage = 'Failed to send connection request. Please try again.';
            
            if (error.response?.status === 400) {
                if (error.response?.data?.detail?.includes('already connected')) {
                    errorMessage = 'You are already connected with this user';
                } else if (error.response?.data?.detail?.includes('pending')) {
                    errorMessage = 'Connection request already pending';
                } else if (error.response?.data?.error) {
                    errorMessage = error.response.data.error;
                }
            }
            
            message.error(errorMessage);
        }
    };

    const handleProfileFollow = async (showDonate = false) => {
        const isConnected = profile.value.connected;
        const endpoint = isConnected ? 'disconnect' : 'connect';
        console.log("is connected", isConnected)
        try {

            const response = await api.post(`/account/users/${profileId.value}/${endpoint}/`);
            profile.value.pending_connection = true;

            if (response.status === 201) {
                // Connection was just established (201 Created)
                profile.value.connected = true;
                profile.value.pending_connection = false;
                profile.value.removed_connection = false;
                message.success(`You are now following ${profile.value.name || 'this user'}`);
                if(showDonate){
                    openDonationModal(post)
                }
            } else if (response.status === 200) {
                if (isConnected) {
                    // Disconnected successfully - reset all connection states
                    profile.value.connected = false;
                    profile.value.pending_connection = false;
                    profile.value.rejected_connection = false;
                    profile.value.removed_connection = true;
                    message.success(`You have unfollowed ${profile.value.name || 'this user'}`);
                } else {
                    // Connection request sent but not yet accepted (shouldn't happen with new flow)
                    profile.value.pending_connection = true;
                    message.success('Connection request sent');
                }
            }
            
        } catch (error) {
            console.error(`Error ${isConnected ? 'unfollowing' : 'following'} user:`, error);
            
            // Reset pending state on error
            profile.value.pending_connection = false;
            
            let errorMessage = `Failed to ${isConnected ? 'unfollow' : 'follow'} user. Please try again.`;
            
            if (error.response?.data?.error) errorMessage = error.response?.data?.error;
            else if (error.response?.data?.message) errorMessage = error.response?.data?.message;  

            message.error(errorMessage);
            if (error.response?.status === 402) {
                // Not enough connects - open the connects modal
                isConnectsModalOpen.value = true;
                return; // Don't show error message as we're handling it with the modal
            } else {
                message.error(errorMessage);
            }
        }
    };

    const handleFollow = async (post, showDonate = false) => {
        if (!post?.posted_by?.id || post.pending_connection || post.rejected_connection) {
            return;
        }

        const userId = post.posted_by.id;
        const isConnected = post.connected;
        const endpoint = isConnected ? 'disconnect' : 'connect';

        try {
            // Set pending state
            const postIndex = posts.value.findIndex(p => p.id === post.id);
            if (postIndex !== -1) {
                posts.value[postIndex].pending_connection = true;
            }

            // Make the API call to either connect or disconnect
            const response = await api.post(`/account/users/${userId}/${endpoint}/`);
            
            // Update the UI based on response status
            if (postIndex !== -1) {
                if (response.status === 201) {
                    // Connection was just established (201 Created)
                    posts.value[postIndex].connected = true;
                    posts.value[postIndex].pending_connection = false;
                    posts.value[postIndex].removed_connection = false;
                    message.success(`You are now following ${post.posted_by.name || 'this user'}`);
                    if(showDonate){
                        openDonationModal(post)
                    }
                } else if (response.status === 200) {
                    if (isConnected) {
                        // Disconnected successfully - reset all connection states
                        posts.value[postIndex].connected = false;
                        posts.value[postIndex].pending_connection = false;
                        posts.value[postIndex].rejected_connection = false;
                        posts.value[postIndex].removed_connection = true;
                        message.success(`You have unfollowed ${post.posted_by.name || 'this user'}`);
                    } else {
                        // Connection request sent but not yet accepted (shouldn't happen with new flow)
                        posts.value[postIndex].pending_connection = true;
                        message.success('Connection request sent');
                    }
                }
            }
            
        } catch (error) {
            console.error(`Error ${isConnected ? 'unfollowing' : 'following'} user:`, error);
            
            // Reset pending state on error
            const postIndex = posts.value.findIndex(p => p.id === post.id);
            if (postIndex !== -1) {
                posts.value[postIndex].pending_connection = false;
            }
            
            let errorMessage = `Failed to ${isConnected ? 'unfollow' : 'follow'} user. Please try again.`;
            
            if (error.response?.data?.error) errorMessage = error.response?.data?.error;
            else if (error.response?.data?.message) errorMessage = error.response?.data?.message;  

            message.error(errorMessage);
            if (error.response?.status === 402) {
                // Not enough connects - open the connects modal
                isConnectsModalOpen.value = true;
                return; // Don't show error message as we're handling it with the modal
            } else {
                message.error(errorMessage);
            }
        }
    };

    // Fetch a single post by ID
    const fetchPostById = async (postId) => {
        try {
            const response = await api.get(`/post/posts/${postId}/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching post:', error);
            message.error('Failed to load post');
            return null;
        }
    };

    // Check URL for post ID and handle post loading
    const checkUrlForPost = async (route) => {
        const postId = route.query.p;
        if (!postId) return;

        // Check if post is already in the feed
        const existingPost = posts.value.find(p => String(p.id) === String(postId));
        if (existingPost) return;

        // If not, fetch the post
        const post = await fetchPostById(postId);
        if (post) {
            // Add to the beginning of the posts array
            posts.value.unshift(post);
        }
    };


    function observePostVisibility() {
        if (visibilityObserver) visibilityObserver.disconnect();

        visibilityObserver = new IntersectionObserver(
            (entries) => {
            entries.forEach((entry) => {
                const id = entry.target.dataset.id.replace("post-", "");
                const index = visiblePosts.value.indexOf(id);

                if (entry.isIntersecting) {
                if (index === -1) {
                    visiblePosts.value.push(id);
                    console.log("VISIBLE:", id);
                }
                } else {
                if (index !== -1) {
                    visiblePosts.value.splice(index, 1);
                    console.log("NOT VISIBLE:", id);
                }
                }
            });

            // Always log the current visible posts
            console.log("VISIBLE:", visiblePosts.value);
            },
            { threshold: 0.1 }
        );

        // Observe all current post items
        document.querySelectorAll("[data-id^='post-']").forEach((el) => {
            visibilityObserver.observe(el);
        });

        // Observe newly added post elements
        if (!mutationObserver) {
            const container = document.querySelector("#post-list");
            if (!container) return;

            mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1 && node.dataset.id?.startsWith("post-")) {
                    visibilityObserver.observe(node);
                }
                });
            });
            });

            mutationObserver.observe(container, { childList: true, subtree: true });
        }
    }


    const fetchVisiblePosts = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const currentPostId = urlParams.get('p');

        if (currentPostId) {
            
            console.log('Fetching single post:', currentPostId);
            // fetch logic for single post
            try {
                const ids = [currentPostId];
                const response = await api.get(`post/posts/get_bulk/?id=${ids}`);
                const fetchedPosts = response.data.results; // array of conversation objects

                // Update conversations in place
                fetchedPosts.forEach((post) => {
                updateOrAddPost(post);
                });
            } catch (error) {
                console.error("Error fetching visible posts:", error);
            }
            return;
        }
        if (!visiblePosts.value.length) return;

        try {
            const ids = visiblePosts.value.join(',');
            const response = await api.get(`post/posts/get_bulk/?id=${ids}`);
            const fetchedPosts = response.data.results; // array of conversation objects

            // Update conversations in place
            fetchedPosts.forEach((post) => {
            updateOrAddPost(post);
            });
        } catch (error) {
            console.error("Error fetching visible posts:", error);
        }
    };


    const updateOrAddPost = (newPost) => {
        console.log("UPDATE OR ADD POST", newPost);
        const index = posts.value.findIndex(p => p.id === newPost.id);
        if (index !== -1) {
            posts.value[index] = { ...posts.value[index], ...newPost };
        } else {
            posts.value.unshift(newPost);
            posts.value.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        }
    };


    let visiblePostsInterval = null;

    const startVisiblePostsPolling = () => {
        if (visiblePostsInterval) clearInterval(visiblePostsInterval);
        
        visiblePostsInterval = setInterval(fetchVisiblePosts, 5000);
    };

    const stopVisiblePostsPolling = () => {
        if (visiblePostsInterval) clearInterval(visiblePostsInterval);
    };

    let profilePollingInterval = null;
    const startProfilePolling = (route) => {
        if (profilePollingInterval) clearInterval(profilePollingInterval);
        profilePollingInterval = setInterval(async () => {
            if (route.params.userId) {
                await fetchUserProfile(route);
            }
        }, 5000);
    }

    const stopProfilePolling = () => {
        if (profilePollingInterval) clearInterval(profilePollingInterval);
    }

    const resetProfileId = () => {
        profileId.value = null;
    }

    watch(posts, (newPosts) => {
        if (selectedPost.value) {
            const updatedPost = newPosts.find(p => p.id === selectedPost.value.id);
            if (updatedPost) {
                selectedPost.value = { ...selectedPost.value, ...updatedPost };
            }
        }
    }, { deep: true });


    return {
        profileId,
        profile,
        postCount,
        profilePollingInterval,
        startProfilePolling,
        stopProfilePolling,
        handleProfileFollow,
        setShowConnectionProfileModal,
        showConnectionProfileModal,
        resetProfileId,

        posts,
        loading,
        loadingMore,
        setLoading,
        nextPage,
        hasNextPage,
        showDonationModal,
        setShowDonationModal,
        selectedPost,
        likingPostId,
        savingPostId,
        showConnectionRequestModal,
        showConnectionPrompt,
        connectionPromptPurpose,
        showCommentModal,
        showConnectionsModal,
        connections,
        loadingConnections,
        setConnections,
        

        openCommentModal,
        closeCommentModal,

        openConnectionPrompt,
        closeConnectionPrompt,
        setConnectionPromptPurpose,

        openShareModal,
        closeShareModal,
        
        openConnectionsModal,
        closeConnectionsModal,
        setLoadingConnections,

        processingDonation,
        setProcessingDonation,

        handleUpdatePostObj,

        fetchUserPosts,
        loadMore,

        openDonationModal,

        closeDonationModal,

        handleChat,
        handleLike,
        handleSave,
        handleFollow,
        confirmConnectionRequest,

        checkUrlForPost,

        startVisiblePostsPolling,
        stopVisiblePostsPolling,

        isConnectsModalOpen,
        setIsConnectsModalOpen,

        observePostVisibility,
        visibilityObserver,
        mutationObserver,

        setShowConnectionRequestModal,
        closeConnectionRequestModal,
        closeConnectionProfileModal,

        fetchUserProfile

    };
});
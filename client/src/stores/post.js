import { defineStore } from "pinia";
import { ref, computed, watch } from 'vue';
import { message } from 'ant-design-vue';
import api from '@/api/axios';

export const usePostStore = defineStore('post', () => {
    const showRecommended = ref(false);
    const hasLoadedCount = ref(false);
    const isInSearch = ref(false);
    const searchQuery = ref(null);
    const searchPostResults = ref([]);
    const searchNextPage = ref(null);
    const isDesktop = ref(false)
    const checkWidth = () => {
      isDesktop.value = window.innerWidth > 425
    }

    const loadingConnections = ref(false);
    const searchProfileResults = ref([]);  
    const connections = ref([]);
    const searchProfileNextPage = ref(null);
    const searchProfileHasNextPage = computed(() => {
        return !!searchProfileNextPage.value;
    });
    const loadingMoreProfiles = ref(false);

    // State
    const posts = ref([]);
    const loading = ref(true);
    const loadingMore = ref(false);
    const nextPage = ref(null);
    const hasNextPage = computed(() => {
        if (isInSearch.value) return !!searchNextPage.value;
        return !!nextPage.value;
    });
    const showDonationModal = ref(false);
    const showCommentModal = ref(false);
    const showConnectionsModal = ref(false);
    const showShareModal = ref(false);
    const connectionPromptPurpose = ref('donate'); 
    const showConnectionPrompt = ref(false);
    const processingDonation = ref(false);

    const selectedPost = ref(null);
    const likingPostId = ref(null);
    const savingPostId = ref(null);
    const showConnectionRequestModal = ref(false);
    const selectedUserForConnection = ref(null);
    const isConnectsModalOpen = ref(false);

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

    const setSelectedUserForConnection = (value) => {
        selectedUserForConnection.value = value;
    }

    const setShowConnectionRequestModal = (value) => {
        showConnectionRequestModal.value = value;
    }  

    const setProcessingDonation = (value) => {
        processingDonation.value = value;
    }

    const visiblePosts = ref([]);
    let visibilityObserver = null;
    let mutationObserver = null;

    const handleUpdatePostObj = (post) => {
        const index = posts.value.findIndex(p => p.id === post.id);
        if (index !== -1) {
            posts.value[index] = post;
        }
    }

    const initBreakpoints = () => {
        checkWidth()
        window.addEventListener('resize', checkWidth)
    }
    const destroyBreakpoints = () => {
        window.removeEventListener('resize', checkWidth)
    }




    const fetchCount = async () => {
        try {
            const response = await api.get("/post/posts/post_count/")
            showRecommended.value = response.data.show_recommended;
            hasLoadedCount.value = true;
        } catch (error) {
            console.error('Error fetching post count:', error);
        }
    }

    const fetchPosts = async (page = 1) => {
        try {
            let url = null;
            let response = null;
            if(!hasLoadedCount.value) await fetchCount();
            if (showRecommended.value) {
                url = '/post/posts/recommended_posts/';
                response = await api.get(url);
            } else {
                url = '/post/posts/';
                response = await api.get(url, {
                    params: {
                        page: page
                    }
                });
            }
            if (showRecommended.value) {
                for (const newPost of response.data) {
                    const index = posts.value.findIndex(p => p.id === newPost.id);
                    if (index == -1) {
                        posts.value.push(newPost);
                    } else {
                        posts.value[index] = { ...posts.value[index], ...newPost };
                    }
                }
            } else if (page > 1) {
                posts.value = [...posts.value, ...response.data.results]; 
                nextPage.value = response.data.next;
            } else {
                posts.value = response.data.results;
                nextPage.value = response.data.next;
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
            message.error('Failed to load posts. Please try again later.');
        } finally {
            loading.value = false;
            loadingMore.value = false;
        }
    };

    const searchPosts = async (query, page = 1) => {
        try {
            const response = await api.get("/post/posts/", {
                params: {
                    search: query,
                    page: page
                }
            });
            if (page > 1) {
                searchPostResults.value = [...searchPostResults.value, ...response.data.results]; 
                searchNextPage.value = response.data.next;
            } else {
                searchPostResults.value = response.data.results;
                searchNextPage.value = response.data.next;
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
            message.error('Failed to load posts. Please try again later.');
        } finally {
            loading.value = false;
            loadingMore.value = false;
        }
    };
    
    const searchProfiles = async (query, page=1) => {
        try {
            const response = await api.get("/account/users/", {
                params: {
                    search: query,
                    page: page
                }
            });
            if (page > 1) {
                searchProfileResults.value = [...searchProfileResults.value, ...response.data.results]; 
                searchProfileNextPage.value = response.data.next;
            }  else {
                searchProfileResults.value = response.data.results;
                searchProfileNextPage.value = response.data.next;
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
            message.error('Failed to load posts. Please try again later.');
        } finally {
            loadingMoreProfiles.value = false;
        }
    }

    const loadMore = () => {
        if (isInSearch.value && !loadingMore.value) {
            loadingMore.value = true;
            
            const next = new URL(searchNextPage.value, window.location.origin);
            const page = next.searchParams.get("page");
            searchPosts(searchQuery.value, page);
        } else if (showRecommended.value && !loadingMore.value) {
            loadingMore.value = true;
            fetchPosts();
        } else if (nextPage.value && !loadingMore.value) {
            loadingMore.value = true;
            
            const next = new URL(nextPage.value, window.location.origin);
            const page = next.searchParams.get("page");
            fetchPosts(page);
        }
    };

    const loadMoreProfiles = () => {
        if (isInSearch.value && !loadingMoreProfiles.value) {
            loadingMoreProfiles.value = true;
            
            const next = new URL(searchProfileNextPage.value, window.location.origin);
            const page = next.searchParams.get("page");
            searchProfiles(searchQuery.value, page);
        }
    }


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

    const openCommentModal = (post) => {
        selectedPost.value = post;
        showCommentModal.value = true;
    };

    const closeCommentModal = () => {
        showCommentModal.value = false;
    };

    const openShareModal = (post) => {
        selectedPost.value = post;
        showShareModal.value = true;
    };
    const closeShareModal = () => {
        showShareModal.value = false;
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

    const closeDonationModal = async (connected = false, router) => {
        if (connected && selectedPost.value) {
            // If user just connected, start a chat
            await handleChat(selectedPost.value, router);
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
        selectedUserForConnection.value = null;
    };

    const confirmConnectionRequest = async (messageText = '') => {
        if (!selectedUserForConnection.value) return;
        
        const post = selectedUserForConnection.value;
        closeConnectionRequestModal();
        
        try {
            const postIndex = posts.value.findIndex(p => p.id === post.id);
            if (postIndex !== -1) {
            posts.value[postIndex].pending_connection = true;
            }
            
            const response = await api.post(`/account/users/${post.posted_by.id}/connect/`, {
            message: messageText
            });
            
            if (postIndex !== -1) {
            if (response.status === 201) {
                // Connection was just established (201 Created)
                posts.value[postIndex].connected = true;
                posts.value[postIndex].pending_connection = false;
                posts.value[postIndex].removed_connection = false;
                message.success(`You are now following ${post.posted_by.name || 'this user'}`);
            } else if (response.status === 200) {
                // Connection request sent
                posts.value[postIndex].pending_connection = true;
                posts.value[postIndex].removed_connection = false;
                message.success('Connection request sent');
            }
            }
        } catch (error) {
            console.error('Error sending connection request:', error);
            
            const postIndex = posts.value.findIndex(p => p.id === post.id);
            if (postIndex !== -1) {
            posts.value[postIndex].pending_connection = false;
            }
            
            let errorMessage = 'Failed to send connection request. Please try again.';
            
            if (error.response?.status === 400) {
                if (error.response?.data?.detail?.includes('already connected')) {
                    errorMessage = 'You are already connected with this user';
                } else if (error.response?.data?.detail?.includes('pending')) {
                    errorMessage = 'Connection request already pending';
                    if (postIndex !== -1) {
                    posts.value[postIndex].pending_connection = true;
                    }
                } else if (error.response?.data?.error) {
                    errorMessage = error.response.data.error;
                }
            }
            
            message.error(errorMessage);
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

    const updatePostFromBackend = async (postId) => {
        if (!postId) return;
        const response = await api.get(`post/posts/get_bulk/?id=${postId}`);
        const post_updated = response?.data?.results && response?.data?.results?.length > 0 ? response?.data?.results[0] : null;
        if (!post_updated) return;
        handleUpdatePostObj(post_updated)
    }

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


    // Search posts
    const search = async (query, route, router) => {
        try {
            searchQuery.value = query;
            loading.value = true;
            isInSearch.value = true;
            
            // If not on the feed page, navigate to it
            if (route.name !== 'Feed') {
                await router.push({ name: 'Feed' });
            }
            
            // This is a dummy implementation - you'll need to implement the actual API call
            console.log('Searching for:', query);

            isInSearch.value = true
            searchPosts(query);
            searchProfiles(query);
            
        } catch (error) {
            console.error('Error searching posts:', error);
            message.error('Failed to search posts');
        } finally {
            loading.value = false;
        }
    };

    const submitReport = async (post_id, reason) => {
        const response = await api.post('report/reports/report_post/', {
            post_id: post_id,
            reason: reason
        });
        return response;
    }

    const fetchComments = async (post_id) => {
        const response = await api.get(`/post/posts/${post_id}/comments/`);
        return response;
    }

    const submitComment = async (post_id, message) => {
        const response = await api.post(`/post/posts/${post_id}/comment/`, {
            message: message.trim()
        });
        return response;
    }

    const updatePaymentMethod = async (id, data) => {
        const response = await api.put(`/post/payment_info/${id}/`, data);
        return response;
    }

    const addPaymentMethod = async (post_id, data) => {
        const response = await api.post(`/post/posts/${post_id}/add_payment_info/`, data);
        return response;
    }

    const removePaymentMethod = async (id) => {
        await api.delete(`/post/payment_info/${id}/`);
    }

    const closeSearch = () => {
        isInSearch.value = false
        searchProfileResults.value = []
        searchPostResults.value = []
        searchProfileNextPage.value = null;
        searchNextPage.value = null;
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
        isInSearch,
        searchPostResults,
        searchQuery,
        searchProfileResults,
        searchProfileHasNextPage,
        loadMoreProfiles,
        closeSearch,
        submitReport,
        fetchComments,
        submitComment,
        updatePaymentMethod,
        addPaymentMethod,
        removePaymentMethod,
        loadingMoreProfiles,
        search,
        posts,
        loading,
        loadingMore,
        nextPage,
        hasNextPage,
        showDonationModal,
        setShowDonationModal,
        selectedPost,
        likingPostId,
        savingPostId,
        showConnectionRequestModal,
        selectedUserForConnection,
        showCommentModal,
        showConnectionPrompt,
        showShareModal,
        showConnectionsModal,
        connectionPromptPurpose,
        isDesktop,
        loadingConnections,
        setLoadingConnections,
        connections,
        setConnections,
        initBreakpoints,
        destroyBreakpoints,

        openCommentModal,
        closeCommentModal,

        openConnectionPrompt,
        closeConnectionPrompt,
        setConnectionPromptPurpose,

        openShareModal,
        closeShareModal,

        openConnectionsModal,
        closeConnectionsModal,
        updatePostFromBackend,
        


        processingDonation,
        setProcessingDonation,
        
        handleUpdatePostObj,
        fetchPostById,
        fetchPosts,
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

        setSelectedUserForConnection,
        setShowConnectionRequestModal,
        closeConnectionRequestModal,
        showRecommended

    };
});
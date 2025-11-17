// Firebase configuration
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
  measurementId: "G-MVRF3WRHPM"
};

// Initialize Firebase
let app;
let auth;
let db;
let storage;

try {
  if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();
    
    console.log('Firebase initialized successfully');
    
    // Enable offline persistence
    db.enablePersistence()
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
          console.warn('The current browser does not support all of the features required to enable persistence');
        }
      });
    
    // Set up Firebase emulator if running locally
    if (window.location.hostname === "localhost") {
      console.log('Using Firebase emulators');
      db.useEmulator("localhost", 8080);
      auth.useEmulator("http://localhost:9099");
      storage.useEmulator("localhost", 9199);
    }
    
    // Set up analytics if available
    if (typeof firebase.analytics === 'function') {
      firebase.analytics();
    }
  } else {
    app = firebase.apps[0];
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();
    
    console.log('Using existing Firebase app');
  }
  
  // Set up Firestore settings
  db.settings({
    timestampsInSnapshots: true,
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
  });
  
  // Log current user status
  auth.onAuthStateChanged(user => {
    if (user) {
      console.log('User signed in:', user.email);
      // Update UI for signed-in user
      updateAuthUI(user);
    } else {
      console.log('No user signed in');
      // Update UI for signed-out user
      updateAuthUI(null);
    }
  });
  
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Fallback to mock data in case of Firebase errors
  setupMockDataFallback();
}

// Update authentication UI
function updateAuthUI(user) {
  const loginLink = document.querySelector('a[href="login.html"]');
  const createPostLink = document.querySelector('a[href="create.html"]');
  const profileLink = document.querySelector('a[href="profile.html"]');
  
  if (user) {
    if (loginLink) {
      loginLink.textContent = 'Dashboard';
      loginLink.href = 'admin.html';
    }
    
    if (createPostLink) {
      createPostLink.classList.remove('hidden');
    }
    
    if (profileLink) {
      profileLink.classList.remove('hidden');
    }
  } else {
    if (loginLink) {
      loginLink.textContent = 'Login';
      loginLink.href = 'login.html';
    }
    
    if (createPostLink) {
      createPostLink.classList.add('hidden');
    }
    
    if (profileLink) {
      profileLink.classList.add('hidden');
    }
  }
}

// Firebase Authentication Functions
const authFunctions = {
  // Sign in with email and password
  signInWithEmailAndPassword: async (email, password) => {
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      console.log('User signed in:', userCredential.user.email);
      return userCredential.user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw new Error(error.message);
    }
  },
  
  // Sign up with email and password
  createUserWithEmailAndPassword: async (email, password, displayName) => {
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      
      // Update profile with display name
      await userCredential.user.updateProfile({
        displayName: displayName,
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff`
      });
      
      console.log('User created:', userCredential.user.email);
      return userCredential.user;
    } catch (error) {
      console.error('Sign up error:', error);
      throw new Error(error.message);
    }
  },
  
  // Sign out
  signOut: async () => {
    try {
      await auth.signOut();
      console.log('User signed out');
      return true;
    } catch (error) {
      console.error('Sign out error:', error);
      throw new Error(error.message);
    }
  },
  
  // Reset password
  sendPasswordResetEmail: async (email) => {
    try {
      await auth.sendPasswordResetEmail(email);
      console.log('Password reset email sent to:', email);
      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      throw new Error(error.message);
    }
  },
  
  // Sign in with Google
  signInWithGoogle: async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    
    try {
      const result = await auth.signInWithPopup(provider);
      console.log('Google sign in successful:', result.user.email);
      return result.user;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw new Error(error.message);
    }
  },
  
  // Sign in with Apple
  signInWithApple: async () => {
    const provider = new firebase.auth.OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    
    try {
      const result = await auth.signInWithPopup(provider);
      console.log('Apple sign in successful');
      return result.user;
    } catch (error) {
      console.error('Apple sign in error:', error);
      throw new Error(error.message);
    }
  }
};

// Firestore Database Functions
const dbFunctions = {
  // Create a new post
  createPost: async (postData) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      const postRef = db.collection('posts').doc();
      
      const post = {
        id: postRef.id,
        title: postData.title,
        content: postData.content,
        excerpt: postData.excerpt || postData.content.substring(0, 250) + '...',
        author: {
          id: user.uid,
          name: user.displayName || user.email.split('@')[0],
          avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email.split('@')[0])}&background=6366f1&color=fff`
        },
        categories: postData.categories || ['thoughts'],
        tags: postData.tags || [],
        featuredImage: postData.featuredImage || '',
        likes: [],
        comments: [],
        shares: 0,
        isPinned: false,
        isDraft: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        seoMeta: {
          title: postData.seoTitle || postData.title,
          description: postData.seoDescription || postData.excerpt || postData.content.substring(0, 160),
          keywords: postData.seoKeywords || postData.tags || []
        },
        stats: {
          views: 0,
          avgTimeSpent: 0,
          bounceRate: 0
        }
      };
      
      await postRef.set(post);
      console.log('Post created successfully:', postRef.id);
      return post;
    } catch (error) {
      console.error('Create post error:', error);
      throw new Error(error.message);
    }
  },
  
  // Update an existing post
  updatePost: async (postId, postData) => {
    try {
      const postRef = db.collection('posts').doc(postId);
      
      const updatedPost = {
        title: postData.title,
        content: postData.content,
        excerpt: postData.excerpt || postData.content.substring(0, 250) + '...',
        categories: postData.categories || ['thoughts'],
        tags: postData.tags || [],
        featuredImage: postData.featuredImage || '',
        isPinned: postData.isPinned || false,
        isDraft: postData.isDraft || false,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        seoMeta: {
          title: postData.seoTitle || postData.title,
          description: postData.seoDescription || postData.excerpt || postData.content.substring(0, 160),
          keywords: postData.seoKeywords || postData.tags || []
        }
      };
      
      await postRef.update(updatedPost);
      console.log('Post updated successfully:', postId);
      return updatedPost;
    } catch (error) {
      console.error('Update post error:', error);
      throw new Error(error.message);
    }
  },
  
  // Delete a post
  deletePost: async (postId) => {
    try {
      const postRef = db.collection('posts').doc(postId);
      await postRef.delete();
      console.log('Post deleted successfully:', postId);
      return true;
    } catch (error) {
      console.error('Delete post error:', error);
      throw new Error(error.message);
    }
  },
  
  // Get a single post
  getPost: async (postId) => {
    try {
      const postRef = db.collection('posts').doc(postId);
      const postSnap = await postRef.get();
      
      if (!postSnap.exists) {
        throw new Error('Post not found');
      }
      
      const postData = postSnap.data();
      
      // Increment view count
      await postRef.update({
        'stats.views': firebase.firestore.FieldValue.increment(1)
      });
      
      return postData;
    } catch (error) {
      console.error('Get post error:', error);
      throw new Error(error.message);
    }
  },
  
  // Get posts with filters and pagination
  getPosts: async (options = {}) => {
    try {
      let postsRef = db.collection('posts');
      
      // Apply filters
      if (options.category) {
        postsRef = postsRef.where('categories', 'array-contains', options.category);
      }
      
      if (options.isPinned !== undefined) {
        postsRef = postsRef.where('isPinned', '==', options.isPinned);
      }
      
      if (options.isDraft !== undefined) {
        postsRef = postsRef.where('isDraft', '==', options.isDraft);
      }
      
      // Apply date filters
      const now = new Date();
      if (options.timeframe === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        postsRef = postsRef.where('createdAt', '>=', firebase.firestore.Timestamp.fromDate(oneWeekAgo));
      } else if (options.timeframe === 'month') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1);
        postsRef = postsRef.where('createdAt', '>=', firebase.firestore.Timestamp.fromDate(oneMonthAgo));
      }
      
      // Apply ordering
      if (options.orderBy === 'likes') {
        postsRef = postsRef.orderBy('likes.length', 'desc');
      } else if (options.orderBy === 'views') {
        postsRef = postsRef.orderBy('stats.views', 'desc');
      } else {
        postsRef = postsRef.orderBy('createdAt', 'desc');
      }
      
      // Apply pagination
      if (options.limit) {
        postsRef = postsRef.limit(options.limit);
      }
      
      if (options.lastDoc) {
        postsRef = postsRef.startAfter(options.lastDoc);
      }
      
      const snapshot = await postsRef.get();
      const posts = [];
      
      snapshot.forEach(doc => {
        posts.push({ id: doc.id, ...doc.data() });
      });
      
      return {
        posts,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
        hasMore: snapshot.docs.length === options.limit
      };
    } catch (error) {
      console.error('Get posts error:', error);
      throw new Error(error.message);
    }
  },
  
  // Like a post
  likePost: async (postId, userId) => {
    try {
      const postRef = db.collection('posts').doc(postId);
      
      // Use batch write for atomic operations
      const batch = db.batch();
      
      // Add user to likes array
      batch.update(postRef, {
        likes: firebase.firestore.FieldValue.arrayUnion(userId)
      });
      
      // Create notification for post author
      const postSnap = await postRef.get();
      if (postSnap.exists) {
        const postData = postSnap.data();
        if (postData.author.id !== userId) {
          const notificationRef = db.collection('notifications').doc();
          batch.set(notificationRef, {
            userId: postData.author.id,
            type: 'like',
            postId: postId,
            fromUserId: userId,
            read: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
      }
      
      await batch.commit();
      console.log('Post liked successfully');
      return true;
    } catch (error) {
      console.error('Like post error:', error);
      throw new Error(error.message);
    }
  },
  
  // Unlike a post
  unlikePost: async (postId, userId) => {
    try {
      const postRef = db.collection('posts').doc(postId);
      await postRef.update({
        likes: firebase.firestore.FieldValue.arrayRemove(userId)
      });
      console.log('Post unliked successfully');
      return true;
    } catch (error) {
      console.error('Unlike post error:', error);
      throw new Error(error.message);
    }
  },
  
  // Create a comment
  createComment: async (postId, commentData) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      const commentRef = db.collection('comments').doc();
      
      const comment = {
        id: commentRef.id,
        postId: postId,
        content: commentData.content,
        author: {
          id: user.uid,
          name: user.displayName || user.email.split('@')[0],
          avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email.split('@')[0])}&background=6366f1&color=fff`
        },
        likes: [],
        replies: [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      // Use batch write for atomic operations
      const batch = db.batch();
      
      // Create comment
      batch.set(commentRef, comment);
      
      // Add comment to post
      const postRef = db.collection('posts').doc(postId);
      batch.update(postRef, {
        comments: firebase.firestore.FieldValue.arrayUnion(commentRef.id)
      });
      
      // Create notification for post author
      const postSnap = await postRef.get();
      if (postSnap.exists) {
        const postData = postSnap.data();
        if (postData.author.id !== user.uid) {
          const notificationRef = db.collection('notifications').doc();
          batch.set(notificationRef, {
            userId: postData.author.id,
            type: 'comment',
            postId: postId,
            commentId: commentRef.id,
            fromUserId: user.uid,
            read: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
      }
      
      await batch.commit();
      console.log('Comment created successfully:', commentRef.id);
      return comment;
    } catch (error) {
      console.error('Create comment error:', error);
      throw new Error(error.message);
    }
  },
  
  // Get comments for a post
  getComments: async (postId) => {
    try {
      const commentsRef = db.collection('comments')
        .where('postId', '==', postId)
        .orderBy('createdAt', 'desc');
      
      const snapshot = await commentsRef.get();
      const comments = [];
      
      snapshot.forEach(doc => {
        comments.push({ id: doc.id, ...doc.data() });
      });
      
      return comments;
    } catch (error) {
      console.error('Get comments error:', error);
      throw new Error(error.message);
    }
  },
  
  // Get user data
  getUser: async (userId) => {
    try {
      const userRef = db.collection('users').doc(userId);
      const userSnap = await userRef.get();
      
      if (!userSnap.exists) {
        throw new Error('User not found');
      }
      
      return userSnap.data();
    } catch (error) {
      console.error('Get user error:', error);
      throw new Error(error.message);
    }
  },
  
  // Update user data
  updateUser: async (userId, userData) => {
    try {
      const userRef = db.collection('users').doc(userId);
      await userRef.update({
        ...userData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('User updated successfully:', userId);
      return true;
    } catch (error) {
      console.error('Update user error:', error);
      throw new Error(error.message);
    }
  },
  
  // Get notifications for user
  getNotifications: async (userId) => {
    try {
      const notificationsRef = db.collection('notifications')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(20);
      
      const snapshot = await notificationsRef.get();
      const notifications = [];
      
      snapshot.forEach(doc => {
        notifications.push({ id: doc.id, ...doc.data() });
      });
      
      return notifications;
    } catch (error) {
      console.error('Get notifications error:', error);
      throw new Error(error.message);
    }
  },
  
  // Mark notification as read
  markNotificationAsRead: async (notificationId) => {
    try {
      const notificationRef = db.collection('notifications').doc(notificationId);
      await notificationRef.update({
        read: true
      });
      console.log('Notification marked as read:', notificationId);
      return true;
    } catch (error) {
      console.error('Mark notification as read error:', error);
      throw new Error(error.message);
    }
  },
  
  // Get analytics data
  getAnalytics: async (timeframe = 'week') => {
    try {
      const now = new Date();
      let startDate = new Date();
      
      if (timeframe === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (timeframe === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else if (timeframe === 'year') {
        startDate.setFullYear(now.getFullYear() - 1);
      }
      
      const postsRef = db.collection('posts')
        .where('createdAt', '>=', firebase.firestore.Timestamp.fromDate(startDate));
      
      const snapshot = await postsRef.get();
      const posts = [];
      
      snapshot.forEach(doc => {
        posts.push({ id: doc.id, ...doc.data() });
      });
      
      // Calculate analytics
      const totalPosts = posts.length;
      const totalLikes = posts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
      const totalViews = posts.reduce((sum, post) => sum + (post.stats?.views || 0), 0);
      const avgEngagement = totalPosts > 0 ? (totalLikes + totalViews) / totalPosts : 0;
      
      // Get most popular categories
      const categoryCounts = {};
      posts.forEach(post => {
        post.categories?.forEach(category => {
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
      });
      
      const popularCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, count]) => ({ category, count }));
      
      return {
        totalPosts,
        totalLikes,
        totalViews,
        avgEngagement,
        popularCategories,
        timeframe
      };
    } catch (error) {
      console.error('Get analytics error:', error);
      throw new Error(error.message);
    }
  }
};

// Storage Functions
const storageFunctions = {
  // Upload file to Firebase Storage
  uploadFile: async (file, path) => {
    try {
      const storageRef = storage.ref();
      const fileRef = storageRef.child(`${path}/${Date.now()}_${file.name}`);
      
      // Upload file
      const snapshot = await fileRef.put(file);
      
      // Get download URL
      const downloadURL = await fileRef.getDownloadURL();
      
      console.log('File uploaded successfully:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('File upload error:', error);
      throw new Error(error.message);
    }
  },
  
  // Delete file from Firebase Storage
  deleteFile: async (url) => {
    try {
      // Extract path from URL
      const path = url.split('/').slice(-2).join('/');
      const fileRef = storage.ref().child(path);
      
      await fileRef.delete();
      console.log('File deleted successfully:', url);
      return true;
    } catch (error) {
      console.error('File delete error:', error);
      throw new Error(error.message);
    }
  }
};

// Mock data fallback for when Firebase is unavailable
function setupMockDataFallback() {
  console.warn('Using mock data fallback');
  
  window.mockData = {
    posts: [
      {
        id: '1',
        title: 'Digital Minimalism: Finding Balance in a Connected World',
        excerpt: 'Exploring how intentional technology use can lead to greater focus, deeper relationships, and more meaningful creative work.',
        author: {
          name: 'Taylor Rodriguez',
          avatar: 'https://randomuser.me/api/portraits/women/65.jpg'
        },
        categories: ['tech'],
        featuredImage: 'https://images.unsplash.com/photo-1547658719-da2b51169166?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
        likes: 231,
        comments: 47,
        shares: 62,
        createdAt: new Date(Date.now() - 86400000) // Yesterday
      },
      {
        id: '2',
        title: 'Redefining Success: Beyond Traditional Metrics',
        excerpt: 'In a world obsessed with external validation, how do we create our own definitions of success that truly resonate with our values and aspirations?',
        author: {
          name: 'Alex & Morgan',
          avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
        },
        categories: ['thoughts'],
        featuredImage: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
        likes: 142,
        comments: 28,
        shares: 35,
        createdAt: new Date(Date.now() - 2 * 86400000) // 2 days ago
      },
      {
        id: '3',
        title: 'Creative Collaboration in the Digital Age',
        excerpt: 'How remote creative teams are building meaningful connections and producing exceptional work despite physical distance.',
        author: {
          name: 'Jordan & Riley',
          avatar: 'https://randomuser.me/api/portraits/men/54.jpg'
        },
        categories: ['creativity'],
        featuredImage: 'https://images.unsplash.com/photo-1523745673561-4ce71af3b785?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
        likes: 87,
        comments: 19,
        shares: 24,
        createdAt: new Date(Date.now() - 3 * 86400000) // 3 days ago
      }
    ],
    categories: [
      { id: 'thoughts', name: 'Thoughts', count: 31 },
      { id: 'tech', name: 'Tech', count: 36 },
      { id: 'motivation', name: 'Motivation', count: 29 },
      { id: 'ideas', name: 'Ideas', count: 24 },
      { id: 'life', name: 'Life', count: 42 }
    ]
  };
}

// Export functions for use in other scripts
window.firebaseConfig = firebaseConfig;
window.authFunctions = authFunctions;
window.dbFunctions = dbFunctions;
window.storageFunctions = storageFunctions;

console.log('Firebase JavaScript module loaded and initialized');

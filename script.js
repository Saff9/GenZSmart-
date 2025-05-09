// Store articles in localStorage with timestamp and ID
let articles = [];
let isLoading = false;

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Load articles with error handling
function loadArticles() {
    try {
        articles = JSON.parse(localStorage.getItem('articles')) || [];
    } catch (error) {
        console.error('Error loading articles:', error);
        articles = [];
    }
}

// Initialize articles on load
loadArticles();

// Search functionality
document.getElementById('search-input').addEventListener('input', debounce((e) => {
    if (isLoading) return;
    const searchTerm = e.target.value.toLowerCase();
    const filteredArticles = articles.filter(article => 
        (article.title && article.title.toLowerCase().includes(searchTerm)) ||
        (article.content && article.content.toLowerCase().includes(searchTerm)) ||
        (article.category && article.category.toLowerCase().includes(searchTerm))
    );
    displayArticles(filteredArticles);
}, 300));

// Show write form
function toggleWriteForm() {
    const writeSection = document.getElementById('write');
    const form = document.getElementById('article-form');
    writeSection.style.display = 'block';
    form.style.display = 'block';
}

// Call on page load
document.addEventListener('DOMContentLoaded', toggleWriteForm);


// Image preview
document.getElementById('image').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('image-preview');
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }
});

// Check if user is authenticated
function checkAuth() {
    const userName = document.querySelector('meta[name="user-name"]')?.content;
    return userName === "saffanakbar942"; // Your Replit username
}

// Function to save article
function saveArticle(article) {
    const articleWithMetadata = {
        ...article,
        id: Date.now(),
        timestamp: new Date().toISOString(),
        likes: 0
    };
    articles.push(articleWithMetadata);
    localStorage.setItem('articles', JSON.stringify(articles));
    displayArticles();
}

// Function to display articles with performance optimization
function displayArticles() {
    const container = document.getElementById('articles-container');
    const fragment = document.createDocumentFragment();
    container.innerHTML = '';
    
    // Add animation delay for each article
    let delay = 0;

    articles.reverse().forEach(article => {
        const articleElement = document.createElement('div');
        articleElement.className = 'article-card';
        articleElement.style.setProperty('--i', delay++);
        articleElement.innerHTML = `
            <h3>${article.title}</h3>
            <p><em>By ${article.author}</em></p>
            <p class="timestamp">${new Date(article.timestamp).toLocaleDateString()}</p>
            ${article.image ? `<img src="${article.image}" alt="${article.title}">` : ''}
            <p>${article.content}</p>
            <div class="article-actions">
                <button onclick="likeArticle('${article.id}')" class="like-btn">
                    ❤️ ${article.likes || 0}
                </button>
				<button onclick="reactArticle('${article.id}', '❤️')" class="reaction-btn">❤️ ${article.reactions?.['❤️'] || 0}</button>
                <button onclick="reactArticle('${article.id}', '😭')" class="reaction-btn">😭 ${article.reactions?.['😭'] || 0}</button>
                <button onclick="reactArticle('${article.id}', '😇')" class="reaction-btn">😇 ${article.reactions?.['😇'] || 0}</button>
                <button onclick="reactArticle('${article.id}', '🔥')" class="reaction-btn">🔥 ${article.reactions?.['🔥'] || 0}</button>
                <button onclick="reactArticle('${article.id}', '😱')" class="reaction-btn">😱 ${article.reactions?.['😱'] || 0}</button>
            </div>
        `;
        container.appendChild(articleElement);
    });
}

// Handle form submission
document.getElementById('article-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Check if email and password match
    const email = "saffanakbar942@gmail.com";
    const password = "Saffan942";

    // Prompt for credentials
    const userEmail = prompt("Enter your email:");
    const userPassword = prompt("Enter your password:");

    if (userEmail !== email || userPassword !== password) {
        alert('Unauthorized: Only the site owner can upload articles');
        return;
    }

    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;
    const content = document.getElementById('content').value;
    const imageFile = document.getElementById('image').files[0];

    let imageData = '';
    if (imageFile) {
        imageData = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.readAsDataURL(imageFile);
        });
    }

    const category = document.getElementById('category').value;

    if (!category) {
        alert('Please select a category');
        return;
    }

    saveArticle({
        title,
        author,
        content,
        category,
        image: imageData,
        date: new Date().toISOString()
    });

    e.target.reset();
});

// Menu button functionality
const menuBtn = document.querySelector('.menu-btn');
const navContent = document.querySelector('.nav-content');

menuBtn.addEventListener('click', () => {
    menuBtn.classList.toggle('active');
    navContent.classList.toggle('active');
    
    // Add animation delay to menu items
    const menuItems = navContent.querySelectorAll('li');
    menuItems.forEach((item, index) => {
        item.style.setProperty('--i', index);
    });
});

// Close menu when clicking a link
document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', () => {
        menuBtn.classList.remove('active');
        navContent.classList.remove('active');
    });
});

// Like article functionality
function likeArticle(articleId) {
    const userLikes = JSON.parse(localStorage.getItem('userLikes') || '[]');

    if (userLikes.includes(articleId)) {
        alert('You have already liked this article!');
        return;
    }

    const article = articles.find(a => a.id === parseInt(articleId));
    if (article) {
        article.likes = (article.likes || 0) + 1;
        userLikes.push(articleId);
        localStorage.setItem('userLikes', JSON.stringify(userLikes));
        localStorage.setItem('articles', JSON.stringify(articles));
        displayArticles();
    }
}

// Reaction article functionality
function reactArticle(articleId, reaction) {
    const userLikes = JSON.parse(localStorage.getItem('userLikes') || '[]');
	const reactionId = `${articleId}-${reaction}`;

    if (userLikes.includes(reactionId)) {
        alert('You have already reacted to this article with this reaction!');
        return;
    }

    const article = articles.find(a => a.id === parseInt(articleId));
    if (article) {
        if (!article.reactions) article.reactions = { '❤️': 0, '😭': 0, '😇': 0, '🔥': 0, '😱': 0 };
        article.reactions[reaction] = (article.reactions[reaction] || 0) + 1;
        userLikes.push(`${articleId}-${reaction}`);
        localStorage.setItem('userLikes', JSON.stringify(userLikes));
        localStorage.setItem('articles', JSON.stringify(articles));
        displayArticles();
    }
}

// Back to top button functionality
const backToTopButton = document.getElementById('back-to-top');

window.onscroll = () => {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        backToTopButton.style.display = 'flex';
    } else {
        backToTopButton.style.display = 'none';
    }
};

backToTopButton.onclick = () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
};

// Display articles on page load
displayArticles();
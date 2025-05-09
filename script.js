
// Store articles in localStorage with timestamp and ID
let articles = JSON.parse(localStorage.getItem('articles')) || [];

// Search functionality
document.getElementById('search-input').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredArticles = articles.filter(article => 
        article.title.toLowerCase().includes(searchTerm) ||
        article.content.toLowerCase().includes(searchTerm) ||
        article.category.toLowerCase().includes(searchTerm)
    );
    displayArticles(filteredArticles);
});

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
    
    articles.reverse().forEach(article => {
        const articleElement = document.createElement('div');
        articleElement.className = 'article-card';
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
    const article = articles.find(a => a.id === parseInt(articleId));
    if (article) {
        article.likes = (article.likes || 0) + 1;
        localStorage.setItem('articles', JSON.stringify(articles));
        displayArticles();
    }
}

// Display articles on page load
displayArticles();

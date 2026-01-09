// Blog configuration and utilities

// Configure marked for syntax highlighting with Prism
marked.setOptions({
    highlight: function (code, lang) {
        if (lang && Prism.languages[lang]) {
            return Prism.highlight(code, Prism.languages[lang], lang);
        }
        return code;
    },
    breaks: true,
    gfm: true
});

// Load and display posts on the home page
async function loadPosts() {
    const container = document.getElementById('posts-container');
    if (!container) return;

    try {
        const response = await fetch('posts.json');
        const posts = await response.json();

        if (posts.length === 0) {
            container.innerHTML = '<p class="loading">No posts yet. Start writing!</p>';
            return;
        }

        // Sort posts by date (newest first)
        posts.sort((a, b) => new Date(b.date) - new Date(a.date));

        container.innerHTML = posts.map(post => `
            <article class="post-card">
                <a href="post.html?slug=${post.slug}">
                    <div class="post-meta">
                        <span class="post-date">${formatDate(post.date)}</span>
                        ${post.tags ? post.tags.map(tag => `<span class="post-tag">${tag}</span>`).join('') : ''}
                    </div>
                    <h2 class="post-title">${post.title}</h2>
                    <p class="post-excerpt">${post.excerpt}</p>
                </a>
            </article>
        `).join('');
    } catch (error) {
        container.innerHTML = `
            <p class="loading">
                Welcome to your blog! Add posts to posts.json to get started.
            </p>
        `;
    }
}

// Load and render a single post
async function loadPost() {
    const container = document.getElementById('post-container');
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');

    if (!slug) {
        window.location.href = 'index.html';
        return;
    }

    try {
        // Get post metadata
        const postsResponse = await fetch('posts.json');
        const posts = await postsResponse.json();
        const post = posts.find(p => p.slug === slug);

        if (!post) {
            container.innerHTML = '<p class="loading">Post not found.</p>';
            return;
        }

        // Get post content
        const contentResponse = await fetch(`posts/${slug}.md`);
        const markdown = await contentResponse.text();
        const htmlContent = marked.parse(markdown);

        // Update page title
        document.title = `${post.title} | Code Journal`;

        container.innerHTML = `
            <a href="index.html" class="back-link">Back to posts</a>
            <header class="post-header">
                <div class="post-meta">
                    <span class="post-date">${formatDate(post.date)}</span>
                    ${post.tags ? post.tags.map(tag => `<span class="post-tag">${tag}</span>`).join('') : ''}
                </div>
                <h1>${post.title}</h1>
            </header>
            <article class="post-content">
                ${htmlContent}
            </article>
        `;

        // Re-highlight any code blocks
        Prism.highlightAll();
    } catch (error) {
        container.innerHTML = '<p class="loading">Error loading post.</p>';
        console.error(error);
    }
}

// Format date nicely
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Initialize based on page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('posts-container')) {
        loadPosts();
    }
    if (document.getElementById('post-container')) {
        loadPost();
    }
});

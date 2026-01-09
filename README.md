# Code Journal 📝

A minimalistic blogging website for documenting coding lessons and journey. Built with vanilla HTML/CSS/JS, designed for GitHub Pages hosting.

## Features

- ✨ **Clean, dark theme** - Easy on the eyes for late-night coding sessions
- 🎨 **Syntax highlighting** - Powered by Prism.js with support for 12+ languages
- 📝 **Markdown support** - Write posts in markdown, they render beautifully
- 📱 **Fully responsive** - Looks great on mobile and desktop
- ⚡ **No build step** - Just static files, deploy anywhere
- 🚀 **GitHub Pages ready** - Push and publish

## Quick Start

1. Clone or fork this repository
2. Edit `posts.json` to add your posts
3. Create markdown files in `posts/` folder
4. Push to GitHub and enable GitHub Pages

## Writing a New Blog Post

### Step 1: Create the markdown file

Create a new `.md` file in the `posts/` folder:

```markdown
# posts/my-new-post.md

This is my new blog post!

## A Section

Some content here with **bold** and *italic* text.

### Code Example

\`\`\`javascript
const greeting = 'Hello, World!';
console.log(greeting);
\`\`\`
```

### Step 2: Add entry to posts.json

Add your post to `posts.json`:

```json
{
    "slug": "my-new-post",
    "title": "My New Post Title", 
    "date": "2026-01-09",
    "tag": "tutorial",
    "excerpt": "A brief description that shows on the home page."
}
```

That's it! Your post is now live.

## File Structure

```
blog-website/
├── index.html          # Home page with post list
├── post.html           # Single post template
├── about.html          # About page
├── styles.css          # All styles
├── posts.json          # Post metadata (title, date, excerpt)
├── js/
│   └── blog.js         # Markdown rendering & post loading
└── posts/
    └── *.md            # Your blog posts in markdown
```

## Supported Languages for Syntax Highlighting

- JavaScript / TypeScript
- Python
- CSS / HTML
- Bash / Shell
- JSON
- Dart (for Flutter!)
- Java
- C / C++
- Rust
- Go

## Customization

### Changing Colors

Edit the CSS variables at the top of `styles.css`:

```css
:root {
    --bg-primary: #0d0d0d;
    --accent: #64ffda;
    /* ... more variables */
}
```

### Adding More Languages

Add more Prism.js language components in the `<script>` tags of `index.html` and `post.html`.

## Deploy to GitHub Pages

1. Push this repo to GitHub
2. Go to **Settings** → **Pages**
3. Under "Source", select **Deploy from a branch**
4. Select `main` branch and `/ (root)` folder
5. Click **Save**

Your blog will be live at `https://yourusername.github.io/repo-name`

## License

MIT - Do whatever you want with it! 🎉

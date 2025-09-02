

# ߚ Lighthouse Optimizer App  
**Upload → Audit → Auto-Fix → Download**

This app is like a personal trainer for your website.  
You give it a raw **HTML file**, it runs **Google Lighthouse** behind the scenes, fixes common issues with **AI-driven optimizations**, and hands you back:  

✅ A Lighthouse report (before + after)  
✅ An optimized HTML file ready to flex with near-ߒ scores  

---

## ✨ Features
- Simple web UI (drag & drop your HTML)  
- ⚡ Runs Lighthouse audits (Performance, SEO, Accessibility, Best Practices)  
- Auto-fixes applied using Cheerio:
  - Adds missing meta tags (charset, viewport, description, lang)  
  - Ensures `alt`, `loading="lazy"`, and `decoding="async"` on images  
  - Secures `target="_blank"` links with `rel="noopener noreferrer"`  
  - Defers scripts for faster load  
  - Fixes multiple `<h1>` issues  
  - Adds accessibility labels to empty buttons  
-  Generates **before vs. after** score comparison  
- ⬇️ One-click download of the optimized HTML  



## ߧ Project Structure
```

lh-optimizer/
│── public/        # Frontend (HTML, CSS, client-side JS)
│── uploads/       # Temp upload folder for user files
│── reports/       # Lighthouse reports stored here
│── server.js      # Express server + API routes
│── optimizer.js   # Cheerio-based HTML optimizer
│── package.json   # Dependencies and scripts

````

---

## ⚡ Installation
1. Clone this repo:
   ```sh
   git clone https://github.com/nawaabali/nawaab-s-optimizer.git
   cd nawaab-s-optimizer
````

2. Install dependencies:

   ```sh
   npm install
   ```
3. Start the server:

   ```sh
   npm start
   ```
4. Visit:
   ߑ [http://localhost:3000](http://localhost:3000)

---

 
### ߑ Credits

Built with ❤️ by **[@nawaabali](https://github.com/nawaabali)**
Powered by **Express, Lighthouse, Puppeteer, Cheerio**

```


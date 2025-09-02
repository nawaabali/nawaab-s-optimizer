import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import serveStatic from 'serve-static';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { optimizeHtml } from './optimizer.js';
import puppeteer from 'puppeteer';

// puppeteer ka chromium path set karo
process.env.CHROME_PATH = puppeteer.executablePath();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const UPLOADS = path.join(__dirname, 'uploads');
const REPORTS = path.join(__dirname, 'reports');
const PUBLIC = path.join(__dirname, 'public');

// Make sure folders exist
for (const p of [UPLOADS, REPORTS]) fs.mkdirSync(p, { recursive: true });

// Static UI
app.use('/', serveStatic(PUBLIC));

// Multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS),
  filename: (_req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g,'_')),
});
const upload = multer({ storage });

// Host uploaded files so Lighthouse can visit them over HTTP
app.use('/uploads', serveStatic(UPLOADS));

app.post('/api/audit', upload.single('html'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const inputPath = req.file.path; // filesystem path
    const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${path.basename(inputPath)}`;

    // 1) First run Lighthouse on the raw upload
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const outDir = path.join(REPORTS, baseName);
    fs.mkdirSync(outDir, { recursive: true });

    const initial = await runLighthouse(publicUrl, outDir);

    // 2) Auto-optimize HTML
    const originalHtml = fs.readFileSync(inputPath, 'utf8');
    const optimizedHtml = optimizeHtml(originalHtml);

    const optimizedPath = path.join(outDir, baseName + '.optimized.html');
    fs.writeFileSync(optimizedPath, optimizedHtml, 'utf8');

    // Re-host optimized HTML for second audit
    const publicOptimizedName = baseName + '.optimized.html';
    fs.copyFileSync(optimizedPath, path.join(UPLOADS, publicOptimizedName));
    const optimizedUrl = `${req.protocol}://${req.get('host')}/uploads/${publicOptimizedName}`;

    // 3) Second Lighthouse run (post-fix)
    const improved = await runLighthouse(optimizedUrl, outDir, 'post');

    return res.json({
      inputUrl: publicUrl,
      optimizedUrl,
      reportsDir: `/reports/${baseName}/`,
      initialScores: pickScores(initial.lhr),
      improvedScores: pickScores(improved.lhr),
      downloadOptimized: `/reports/${baseName}/${baseName}.optimized.html`
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Expose reports dir for downloads
app.use('/reports', serveStatic(REPORTS));


app.listen(3000, () => console.log('LH Optimizer running on http://localhost:3000'));

async function runLighthouse(url, outDir, tag = 'pre') {
  const chrome = await launch({ chromeFlags: ['--headless=new', '--no-sandbox'] });
  try {
    const opts = { 
      logLevel: 'info', 
      output: ['html', 'json'], 
      onlyCategories: ['performance','accessibility','best-practices','seo'], 
      port: chrome.port 
    };
    const config = null; // default config
    const runnerResult = await lighthouse(url, opts, config);

    const htmlReport = runnerResult.report[0];
    const jsonReport = runnerResult.report[1];

    fs.writeFileSync(path.join(outDir, `${tag}-lighthouse.html`), htmlReport);
    fs.writeFileSync(path.join(outDir, `${tag}-lighthouse.json`), jsonReport);

    return runnerResult;
  } finally {
    await chrome.kill();
  }
}

function pickScores(lhr) {
  const cat = lhr.categories;
  const round = v => Math.round((v.score || 0) * 100);
  return {
    performance: round(cat.performance),
    accessibility: round(cat["accessibility"]),
    bestPractices: round(cat["best-practices"]),
    seo: round(cat.seo),
    lcp: lhr.audits['largest-contentful-paint']?.displayValue,
    fcp: lhr.audits['first-contentful-paint']?.displayValue,
    tbt: lhr.audits['total-blocking-time']?.displayValue,
    cls: lhr.audits['cumulative-layout-shift']?.displayValue
  };
}

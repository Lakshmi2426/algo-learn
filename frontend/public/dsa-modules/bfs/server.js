const http = require('http');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.mp3':  'audio/mpeg',
  '.wav':  'audio/wav',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.ogg':  'video/ogg',
};

function requestHandler(req, res) {
  try {
    let reqPath = decodeURIComponent(req.url.split('?')[0]);
    if (reqPath === '/' || reqPath === '') {
      reqPath = '/index.html';
    }

    let filePath = path.join(PUBLIC_DIR, reqPath);

    // Prevent directory traversal
    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      return res.end('403 Forbidden');
    }

    // Support /video/ and /videos/ interchangeably, and alias video1/video2 to user added videos
    try {
      const videosDir = path.join(PUBLIC_DIR, 'videos');
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        if (reqPath.startsWith('/video/')) {
          const altPath = path.join(PUBLIC_DIR, reqPath.replace('/video/', '/videos/'));
          if (fs.existsSync(altPath) && fs.statSync(altPath).isFile()) {
            filePath = altPath;
          }
        } else if (reqPath.startsWith('/videos/')) {
          const altPath = path.join(PUBLIC_DIR, reqPath.replace('/videos/', '/video/'));
          if (fs.existsSync(altPath) && fs.statSync(altPath).isFile()) {
            filePath = altPath;
          }
        }
      }

      // Check for video1.mp4 / video2.mp4 fallback alias
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        const basename = path.basename(filePath).toLowerCase();
        if (basename === 'video1.mp4' || basename === 'video-1.mp4' || basename === 'video final 1.mp4') {
          const v1 = path.join(videosDir, 'video final 1.mp4');
          if (fs.existsSync(v1) && fs.statSync(v1).isFile()) filePath = v1;
        } else if (basename === 'video2.mp4' || basename === 'video-2.mp4' || basename === 'video final 2.mp4') {
          const v2 = path.join(videosDir, 'video final 2.mp4');
          if (fs.existsSync(v2) && fs.statSync(v2).isFile()) filePath = v2;
        }
      }
    } catch (e) {
      // ignore path resolution checks
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('404 Not Found');
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const totalSize = stats.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
        const chunkSize = (end - start) + 1;
        const fileStream = fs.createReadStream(filePath, { start, end });

        fileStream.on('error', (streamErr) => {
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
          }
          res.end('Error streaming file');
        });

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${totalSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
        });
        fileStream.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': totalSize,
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'no-cache'
        });
        const fileStream = fs.createReadStream(filePath);
        fileStream.on('error', (streamErr) => {
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
          }
          res.end('Error streaming file');
        });
        fileStream.pipe(res);
      }
    });
  } catch (error) {
    console.error('Request handler error:', error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
    }
    res.end('Internal Server Error');
  }
}

const PORT = 3000;

const server = http.createServer(requestHandler);
server.on('error', (err) => {
  console.error(`Server error: ${err.message}`);
});
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ AlgoLearn BFS server active on http://0.0.0.0:${PORT}`);
});



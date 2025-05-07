const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json()); // Untuk parsing JSON

const downloadFolder = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadFolder)) {
    fs.mkdirSync(downloadFolder);
}

// Endpoint: Download video
app.post('/download', (req, res) => {
  const videoUrl = req.body.url;

  if (!videoUrl || !videoUrl.includes('dailymotion.com/video')) {
    return res.json({ success: false, message: 'URL tidak valid' });
  }

  const filename = '%(title)s.%(ext)s';

  const ytdlCommand = `yt-dlp -f best -o "${downloadFolder}/${filename}" "${videoUrl}"`;

  exec(ytdlCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.json({ success: false, message: 'Gagal mengunduh video' });
    }
    // Cari file terbaru
    fs.readdir(downloadFolder, (err, files) => {
      if (err || files.length === 0) {
        return res.json({ success: false, message: 'File tidak ditemukan' });
      }
      const latestFile = files
        .filter(f => f.match(/\.(mp4|mkv|webm)$/))
        .sort((a, b) => {
          return fs.statSync(path.join(downloadFolder, b)).mtime - fs.statSync(path.join(downloadFolder, a)).mtime;
        })[0];

      const link = `/downloads/${latestFile}`;
      return res.json({ success: true, message: 'Video diunduh', downloadLink: link });
    });
  });
});

app.use('/downloads', express.static(downloadFolder));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});

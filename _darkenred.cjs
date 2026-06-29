const Jimp = require('jimp');
const SRC = 'public/werner-banner.brightred.png';
const OUT = process.argv[2] || 'public/werner-banner.dark.png';
Jimp.read(SRC).then(img => {
  const w = img.bitmap.width, h = img.bitmap.height;
  img.scan(0, 0, w, h, function (x, y, idx) {
    const d = this.bitmap.data;
    const r = d[idx], g = d[idx + 1], b = d[idx + 2];
    // red-dominant (background red + red packaging + pink glows + burger tomato); excludes yellow/cream/green/orange food
    const isRed = (r - g) > 50 && (r - b) > 60 && g < 120 && b < 120;
    if (isRed) {
      d[idx] = Math.round(r * 0.47);
      d[idx + 1] = Math.round(g * 0.33);
      d[idx + 2] = Math.round(b * 0.33);
    }
  });
  return img.writeAsync(OUT);
}).then(() => console.log('done')).catch(e => { console.error(e); process.exit(1); });

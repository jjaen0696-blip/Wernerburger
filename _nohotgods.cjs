const Jimp = require('jimp');
const SRC = process.argv[2] || 'public/werner-banner.dark.png';
const OUT = process.argv[3] || 'public/werner-banner.nohot.png';
Jimp.read(SRC).then(img => {
  const w = img.bitmap.width, h = img.bitmap.height;
  const d = img.bitmap.data;
  const px = (x, y) => Jimp.intToRGBA(img.getPixelColor(x, y));
  const avg = (cx, cy, rad) => {
    let r = 0, g = 0, b = 0, n = 0;
    for (let y = cy - rad; y <= cy + rad; y++) for (let x = cx - rad; x <= cx + rad; x++) {
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const c = px(x, y); r += c.r; g += c.g; b += c.b; n++;
    }
    return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
  };
  const fillRect = (x0, y0, x1, y1, c) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const i = (w * y + x) << 2; d[i] = c.r; d[i + 1] = c.g; d[i + 2] = c.b; d[i + 3] = 255;
    }
  };
  const fillCircle = (cx, cy, rad, c) => {
    for (let y = cy - rad; y <= cy + rad; y++) for (let x = cx - rad; x <= cx + rad; x++) {
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      if ((x - cx) ** 2 + (y - cy) ** 2 > rad * rad) continue;
      const i = (w * y + x) << 2; d[i] = c.r; d[i + 1] = c.g; d[i + 2] = c.b; d[i + 3] = 255;
    }
  };
  const bg = { r: 88, g: 3, b: 3 };

  // fry boxes: cover HOTGODS text with panel red sampled from a safe interior point
  // [x0,y0,x1,y1, sampleX,sampleY]
  const boxTexts = [
    [128, 220, 296, 282, 95, 255],     // left fry box
    [1276, 366, 1424, 412, 1345, 438], // center-right fry box
    [1516, 710, 1704, 764, 1605, 795], // bottom-right fry box
  ];
  for (const [x0, y0, x1, y1, sx, sy] of boxTexts) fillRect(x0, y0, x1, y1, avg(sx, sy, 4));

  // flame sauce bags: cover only the text band (keep flame), with bag red
  fillRect(70, 482, 188, 534, avg(160, 540, 3));   // left bag
  fillRect(1530, 380, 1638, 424, avg(1590, 440, 3)); // right bag

  // globe badges: whole logo is HOTGODS -> remove to background
  fillCircle(400, 688, 75, bg);
  fillCircle(1456, 190, 76, bg);

  return img.writeAsync(OUT);
}).then(() => console.log('done')).catch(e => { console.error(e); process.exit(1); });

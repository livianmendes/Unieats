const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const outDir = path.join(__dirname, '..', 'assets', 'food');
fs.mkdirSync(outDir, { recursive: true });

const width = 600;
const height = 420;

function crc32(buffer) {
  let crc = -1;

  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }

  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  const crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function mix(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function createCanvas(top, bottom) {
  const data = Buffer.alloc(width * height * 4);
  const c1 = hexToRgb(top);
  const c2 = hexToRgb(bottom);

  for (let y = 0; y < height; y += 1) {
    const t = y / height;
    const color = [
      mix(c1[0], c2[0], t),
      mix(c1[1], c2[1], t),
      mix(c1[2], c2[2], t),
    ];

    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      data[index] = color[0];
      data[index + 1] = color[1];
      data[index + 2] = color[2];
      data[index + 3] = 255;
    }
  }

  return data;
}

function fillRect(data, x, y, w, h, color) {
  const [r, g, b] = hexToRgb(color);
  const x1 = Math.max(0, Math.floor(x));
  const y1 = Math.max(0, Math.floor(y));
  const x2 = Math.min(width, Math.ceil(x + w));
  const y2 = Math.min(height, Math.ceil(y + h));

  for (let yy = y1; yy < y2; yy += 1) {
    for (let xx = x1; xx < x2; xx += 1) {
      const index = (yy * width + xx) * 4;
      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
    }
  }
}

function fillCircle(data, cx, cy, radius, color) {
  const [r, g, b] = hexToRgb(color);
  const r2 = radius * radius;

  for (let y = Math.max(0, cy - radius); y < Math.min(height, cy + radius); y += 1) {
    for (let x = Math.max(0, cx - radius); x < Math.min(width, cx + radius); x += 1) {
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r2) {
        const index = (Math.floor(y) * width + Math.floor(x)) * 4;
        data[index] = r;
        data[index + 1] = g;
        data[index + 2] = b;
      }
    }
  }
}

function fillEllipse(data, cx, cy, rx, ry, color) {
  const [r, g, b] = hexToRgb(color);

  for (let y = Math.max(0, cy - ry); y < Math.min(height, cy + ry); y += 1) {
    for (let x = Math.max(0, cx - rx); x < Math.min(width, cx + rx); x += 1) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) {
        const index = (Math.floor(y) * width + Math.floor(x)) * 4;
        data[index] = r;
        data[index + 1] = g;
        data[index + 2] = b;
      }
    }
  }
}

function fillTriangle(data, ax, ay, bx, by, cx, cy, color) {
  const [r, g, b] = hexToRgb(color);
  const minX = Math.max(0, Math.floor(Math.min(ax, bx, cx)));
  const maxX = Math.min(width, Math.ceil(Math.max(ax, bx, cx)));
  const minY = Math.max(0, Math.floor(Math.min(ay, by, cy)));
  const maxY = Math.min(height, Math.ceil(Math.max(ay, by, cy)));
  const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);

  for (let y = minY; y < maxY; y += 1) {
    for (let x = minX; x < maxX; x += 1) {
      const w1 = ((bx - ax) * (y - ay) - (by - ay) * (x - ax)) / area;
      const w2 = ((cx - bx) * (y - by) - (cy - by) * (x - bx)) / area;
      const w3 = ((ax - cx) * (y - cy) - (ay - cy) * (x - cx)) / area;

      if (w1 >= 0 && w2 >= 0 && w3 >= 0) {
        const index = (y * width + x) * 4;
        data[index] = r;
        data[index + 1] = g;
        data[index + 2] = b;
      }
    }
  }
}

function savePng(name, data) {
  const raw = Buffer.alloc((width * 4 + 1) * height);

  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0;
    data.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;

  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);

  fs.writeFileSync(path.join(outDir, name), png);
}

function plate(data) {
  fillEllipse(data, 300, 265, 210, 90, '#ffffff');
  fillEllipse(data, 300, 265, 170, 62, '#f1f5f9');
}

const scenes = {
  brigadeiro(data) {
    plate(data);
    [[220, 230], [300, 215], [380, 232], [260, 290], [340, 292]].forEach(([x, y], index) => {
      fillCircle(data, x, y, 54, index % 2 ? '#5b2a1f' : '#3f1d15');
      fillCircle(data, x - 12, y - 16, 10, '#f8c8dc');
      fillCircle(data, x + 16, y + 10, 8, '#f7d046');
    });
  },
  bolo(data) {
    plate(data);
    fillTriangle(data, 185, 315, 420, 120, 470, 315, '#5b2a1f');
    fillTriangle(data, 208, 290, 402, 135, 445, 290, '#f8d8a8');
    fillRect(data, 235, 236, 160, 22, '#ffffff');
    fillRect(data, 260, 195, 105, 18, '#ffffff');
    fillCircle(data, 380, 155, 18, '#d82020');
  },
  pote(data) {
    fillRect(data, 205, 95, 190, 260, '#f5e7d7');
    fillRect(data, 220, 120, 160, 58, '#6b2f22');
    fillRect(data, 220, 194, 160, 58, '#ffffff');
    fillRect(data, 220, 268, 160, 58, '#6b2f22');
    fillRect(data, 190, 78, 220, 34, '#111111');
    fillCircle(data, 300, 236, 36, '#d82020');
  },
  coxinha(data) {
    plate(data);
    [[240, 248], [310, 222], [375, 255], [305, 295]].forEach(([x, y]) => {
      fillEllipse(data, x, y + 30, 48, 58, '#d9902f');
      fillTriangle(data, x - 40, y + 18, x, y - 78, x + 40, y + 18, '#e5a23d');
      fillCircle(data, x - 13, y - 8, 7, '#f8d48a');
    });
  },
  donuts(data) {
    plate(data);
    [[235, 230], [330, 215], [390, 286], [255, 305]].forEach(([x, y], index) => {
      fillCircle(data, x, y, 55, index % 2 ? '#e59f45' : '#f3b65f');
      fillCircle(data, x, y, 25, '#f1f5f9');
      fillCircle(data, x - 15, y - 18, 8, '#f8c8dc');
      fillCircle(data, x + 16, y + 12, 7, '#4f241a');
    });
  },
  sanduiche(data) {
    plate(data);
    fillTriangle(data, 180, 290, 330, 130, 450, 290, '#f2c277');
    fillTriangle(data, 200, 275, 330, 150, 420, 275, '#ffffff');
    fillRect(data, 225, 238, 170, 25, '#7ac66b');
    fillRect(data, 240, 263, 135, 20, '#d94f3d');
  },
  cafe(data) {
    fillEllipse(data, 300, 306, 230, 60, '#ffffff');
    fillRect(data, 205, 145, 190, 150, '#ffffff');
    fillEllipse(data, 300, 145, 95, 28, '#ffffff');
    fillEllipse(data, 300, 148, 76, 18, '#6b2f22');
    fillCircle(data, 420, 210, 45, '#ffffff');
    fillCircle(data, 420, 210, 25, '#f2caca');
  },
  brownie(data) {
    plate(data);
    for (let y = 0; y < 2; y += 1) {
      for (let x = 0; x < 3; x += 1) {
        fillRect(data, 190 + x * 75, 190 + y * 65, 66, 56, '#3f1d15');
        fillCircle(data, 210 + x * 75, 207 + y * 65, 7, '#ffffff');
      }
    }
  },
  hero(data) {
    fillRect(data, 0, 0, width, height, '#f7c6c6');
    plate(data);
    fillCircle(data, 185, 240, 54, '#5b2a1f');
    fillTriangle(data, 255, 318, 380, 125, 470, 318, '#f8d8a8');
    fillEllipse(data, 410, 265, 52, 68, '#e5a23d');
    fillCircle(data, 335, 276, 44, '#f3b65f');
    fillCircle(data, 335, 276, 20, '#f1f5f9');
  },
  finish(data) {
    fillRect(data, 0, 0, width, height, '#f7c6c6');
    fillCircle(data, 300, 190, 110, '#ffffff');
    fillCircle(data, 250, 175, 38, '#5b2a1f');
    fillTriangle(data, 292, 238, 385, 118, 430, 238, '#f8d8a8');
    fillEllipse(data, 315, 270, 160, 46, '#ffffff');
  },
};

Object.entries(scenes).forEach(([name, draw]) => {
  const data = createCanvas('#fbdada', '#f3aaaa');
  draw(data);
  savePng(`${name}.png`, data);
});

['avatar-livian', 'avatar-max', 'avatar-luan', 'avatar-cleiton'].forEach((name, index) => {
  const data = createCanvas(['#fbdada', '#dbeafe', '#dcfce7', '#fef3c7'][index], ['#f3aaaa', '#93c5fd', '#86efac', '#fbbf24'][index]);
  fillCircle(data, 300, 155, 70, ['#4f241a', '#111827', '#5b2a1f', '#374151'][index]);
  fillCircle(data, 300, 160, 52, ['#f6c3a8', '#d9a07e', '#8d5524', '#c68642'][index]);
  fillRect(data, 235, 245, 130, 92, ['#d82020', '#050505', '#16a34a', '#7c3aed'][index]);
  fillCircle(data, 275, 150, 7, '#050505');
  fillCircle(data, 325, 150, 7, '#050505');
  fillEllipse(data, 300, 188, 28, 10, '#ffffff');
  savePng(`${name}.png`, data);
});

console.log('Food assets generated.');

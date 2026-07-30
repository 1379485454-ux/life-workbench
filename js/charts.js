/* ============================================
   图表可视化工具库 · 纯 SVG/CSS 实现
   进度环 | 柱状图 | 热力图 | 圆环图 | 星级 | 折线
   ============================================ */

/**
 * 进度环 (SVG)
 * @param {number} percent 0-100
 * @param {object} opts {size, stroke, color, bg, label, sub}
 */
function progressRing(percent, opts = {}) {
  const size = opts.size || 100;
  const stroke = opts.stroke || 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, percent)) / 100);
  const color = opts.color || '#2563eb';
  const bg = opts.bg || '#e8edf5';
  const label = opts.label !== undefined ? opts.label : `${Math.round(percent)}%`;
  const sub = opts.sub || '';
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle class="ring-track" cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${bg}" stroke-width="${stroke}"/>
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"
      stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${offset}"
      transform="rotate(-90 ${size/2} ${size/2})" style="transition:stroke-dashoffset 0.8s ease"/>
    <text x="${size/2}" y="${sub ? size/2-4 : size/2}" class="progress-ring-text" fill="${color}" style="font-size:${size*0.2}px">${label}</text>
    ${sub ? `<text x="${size/2}" y="${size/2+14}" text-anchor="middle" fill="#94a3b8" style="font-size:${size*0.11}px;font-weight:600">${sub}</text>` : ''}
  </svg>`;
}

/**
 * 柱状图
 * @param {array} data [{label, value, color?, today?}]
 * @param {object} opts {height, max}
 */
function barChart(data, opts = {}) {
  const height = opts.height || 100;
  const max = opts.max || Math.max(...data.map(d => d.value), 1);
  const defaultColor = opts.color || '#3b82f6';
  return `<div class="bar-chart" style="height:${height}px">
    ${data.map(d => {
      const h = max > 0 ? (d.value / max * 100) : 0;
      const color = d.color || defaultColor;
      return `<div class="bar-chart-item">
        <div class="bar-chart-bar-wrap">
          <div class="bar-chart-bar ${d.today ? 'today' : ''}" style="height:${h}%;background:${color}" title="${d.value}"></div>
        </div>
        <div class="bar-chart-label">${d.label}</div>
      </div>`;
    }).join('')}
  </div>`;
}

/**
 * 热力图 (7天 x N周)
 * @param {array} data [{date:'YYYY-MM-DD', value:0}]
 * @param {object} opts {weeks}
 */
function heatmap(data, opts = {}) {
  const weeks = opts.weeks || 4;
  const days = weeks * 7;
  const today = new Date();
  const cells = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const item = data.find(x => x.date === dateStr);
    const val = item ? item.value : 0;
    let level = '';
    if (val > 0) level = 'l1';
    if (val >= 2) level = 'l2';
    if (val >= 3) level = 'l3';
    if (val >= 5) level = 'l4';
    const isToday = i === 0;
    const dayLabel = ['日','一','二','三','四','五','六'][d.getDay()];
    cells.push(`<div class="heatmap-cell ${level} ${isToday?'today':''}" title="${dateStr}: ${val}">${val || ''}</div>`);
  }
  return `<div class="heatmap">${cells.join('')}</div>
    <div class="heatmap-labels"><span>${weeks}周前</span><span>少</span><span>多</span></div>`;
}

/**
 * 圆环图 (分类占比)
 * @param {array} data [{label, value, color}]
 * @param {object} opts {size, stroke}
 */
function donutChart(data, opts = {}) {
  const size = opts.size || 140;
  const stroke = opts.stroke || 22;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return '<div class="empty-state text-muted text-sm">暂无数据</div>';
  let offset = 0;
  const segments = data.filter(d => d.value > 0).map(d => {
    const pct = d.value / total;
    const dash = c * pct;
    const seg = `<circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${d.color}" stroke-width="${stroke}"
      stroke-dasharray="${dash} ${c - dash}" stroke-dashoffset="${-offset}"
      transform="rotate(-90 ${size/2} ${size/2})" style="transition:stroke-dasharray 0.6s ease"/>`;
    offset += dash;
    return seg;
  }).join('');
  const legend = data.filter(d => d.value > 0).map(d => {
    const pct = ((d.value / total) * 100).toFixed(0);
    return `<div class="donut-legend-item">
      <div class="donut-legend-dot" style="background:${d.color}"></div>
      <div class="donut-legend-label">${d.label}</div>
      <div class="donut-legend-value">¥${d.value.toFixed(0)} · ${pct}%</div>
    </div>`;
  }).join('');
  return `<div class="donut-chart-wrap">
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="#f1f5f9" stroke-width="${stroke}"/>
      ${segments}
      <text x="${size/2}" y="${size/2-6}" text-anchor="middle" fill="#64748b" style="font-size:11px;font-weight:600">总支出</text>
      <text x="${size/2}" y="${size/2+12}" text-anchor="middle" fill="#1e293b" style="font-size:18px;font-weight:800">¥${total.toFixed(0)}</text>
    </svg>
    <div class="donut-chart-legend">${legend}</div>
  </div>`;
}

/**
 * 星级评分
 * @param {number} rating 0-10
 * @param {number} max default 10
 */
function starRating(rating, max = 10) {
  const stars = Math.floor(rating / 2);
  const half = (rating / 2) % 1 >= 0.5;
  let html = '<div class="star-rating">';
  for (let i = 0; i < 5; i++) {
    if (i < stars) html += '<span class="star filled">★</span>';
    else if (i === stars && half) html += '<span class="star half">★</span>';
    else html += '<span class="star">★</span>';
  }
  html += `</div>`;
  return html;
}

/**
 * 折线图 (简易 SVG)
 * @param {array} data [{label, value}]
 * @param {object} opts {height, color, max}
 */
function lineChart(data, opts = {}) {
  const w = opts.width || 280;
  const h = opts.height || 80;
  const pad = 6;
  const max = opts.max || Math.max(...data.map(d => d.value), 1);
  const min = 0;
  const range = max - min || 1;
  const stepX = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;
  const points = data.map((d, i) => {
    const x = pad + i * stepX;
    const y = h - pad - ((d.value - min) / range) * (h - pad * 2);
    return { x, y, ...d };
  });
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const area = path + ` L ${points[points.length-1].x} ${h-pad} L ${pad} ${h-pad} Z`;
  const color = opts.color || '#3b82f6';
  const dots = points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="${color}" />`).join('');
  const labels = points.map((p, i) => i % 2 === 0 ? `<text x="${p.x}" y="${h-1}" text-anchor="middle" fill="#94a3b8" style="font-size:9px">${p.label}</text>` : '').join('');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <path d="${area}" fill="${color}" opacity="0.1"/>
    <path d="${path}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}
    ${labels}
  </svg>`;
}

/**
 * 获取最近N天的日期数组
 */
function lastNDays(n) {
  const arr = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    arr.push(d.toISOString().split('T')[0]);
  }
  return arr;
}

/**
 * 获取最近N天的短日期标签 (周一/二...)
 */
function dayLabels(n) {
  const names = ['日','一','二','三','四','五','六'];
  const today = new Date();
  const arr = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    arr.push(names[d.getDay()]);
  }
  return arr;
}

/**
 * 雷达图 (属性面板用)
 * data: [{ label, value(0-100), color }]
 */
function radarChart(data, opts = {}) {
  const size = opts.size || 280;
  const cx = size / 2, cy = size / 2, R = size / 2 - 40;
  const n = data.length;
  if (n < 3) return '';
  const angle = (i) => (Math.PI * 2 * i / n) - Math.PI / 2;
  const point = (i, r) => [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))];
  const rings = [0.25, 0.5, 0.75, 1];
  let grid = '';
  rings.forEach(rr => {
    const pts = data.map((_, i) => point(i, R * rr).map(v => v.toFixed(1)).join(',')).join(' ');
    grid += `<polygon points="${pts}" fill="none" stroke="#e2e8f0" stroke-width="1"/>`;
  });
  let axes = '', labels = '';
  data.forEach((d, i) => {
    const [x, y] = point(i, R);
    axes += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#e8edf5" stroke-width="1"/>`;
    const [lx, ly] = point(i, R + 20);
    labels += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="13" fill="#64748b" font-weight="600">${esc(d.label)}</text>`;
  });
  const toPts = (scale) => data.map((d, i) => point(i, R * scale).map(v => v.toFixed(1)).join(',')).join(' ');
  const dataPts = toPts(0);
  const dots = data.map((d, i) => {
    const [x, y] = point(i, R * (Math.max(0, Math.min(100, d.value)) / 100));
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" fill="${d.color || '#2563eb'}" stroke="#fff" stroke-width="1.5"/>`;
  }).join('');
  const avg = data.reduce((s, d) => s + Math.max(0, Math.min(100, d.value)), 0) / n;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="radar-chart">${grid}${axes}<polygon points="${dataPts}" fill="rgba(37,99,235,0.16)" stroke="#2563eb" stroke-width="2.5" stroke-linejoin="round"/>${dots}${labels}<text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="12" fill="#94a3b8" font-weight="600">综合 ${avg.toFixed(0)}</text></svg>`;
}

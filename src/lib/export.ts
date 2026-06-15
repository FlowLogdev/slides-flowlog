// src/lib/export.ts
import { Presentation, ExportFormat } from './types'
import { getTheme } from './themes'

export async function exportPresentation(pres: Presentation, format: ExportFormat) {
  switch (format) {
    case 'pptx': return exportPPTX(pres)
    case 'html': return exportHTML(pres)
    case 'json': return exportJSON(pres)
    case 'docx': return exportDOCX(pres)
    case 'pdf':  return exportPDF(pres)
  }
}

async function exportPPTX(pres: Presentation) {
  const PptxGenJS = (await import('pptxgenjs')).default
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE'

  const theme = getTheme(pres.theme)
  const accent = pres.accent || theme.accentOverride || '#0ACF83'
  const accentHex = accent.replace('#', '')
  const isPinvest = pres.theme === 'pinvest'
  const isDark = ['dark', 'gradient', 'pinvest'].includes(pres.theme)
  const bgColor = isPinvest ? '0D0E11' : isDark ? '0D0F0E' : 'FFFFFF'
  const titleColor = isPinvest ? 'F5F2EC' : isDark ? 'F5F7F6' : '0D0F0E'
  const bodyColor = isPinvest ? 'C5BFB3' : isDark ? '9BA09D' : '3A3D3B'
  const font = pres.font || theme.fontOverride || 'Calibri'

  pres.slides.forEach((s, i) => {
    const slide = pptx.addSlide()
    slide.background = { color: bgColor }

    // Pinvest-specific decorative elements
    if (isPinvest) {
      // Top gold rule
      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.04, fill: { color: accentHex } })
      // Bottom footer bar
      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 6.9, w: '100%', h: 0.15, fill: { color: '1a1c1f' } })
      // Footer text
      slide.addText('PINVEST CAPITAL  ◆  CONFIDENTIAL', {
        x: 0.4, y: 6.92, w: 7, h: 0.12,
        fontSize: 7, fontFace: 'Courier New',
        color: accentHex, bold: false,
        charSpacing: 2
      })
      slide.addText(`${i + 1}`, {
        x: 8.8, y: 6.92, w: 0.8, h: 0.12,
        fontSize: 7, fontFace: 'Courier New',
        color: accentHex, align: 'right'
      })
      // Left gold accent bar
      slide.addShape(pptx.ShapeType.rect, { x: 0.45, y: 0.6, w: 0.03, h: 0.5, fill: { color: accentHex } })
    } else {
      // Standard accent bar
      slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.5, w: 0.04, h: 0.4, fill: { color: accentHex } })
    }

    const isCenter = s.layout === 'centered' || s.layout === 'pinvest-title' || s.layout === 'pinvest-closing'
    const titleX = isPinvest ? 0.65 : 0.7
    const titleY = isCenter ? 2.2 : 0.45
    const titleSize = isCenter ? (isPinvest ? 52 : 44) : (isPinvest ? 38 : 32)

    slide.addText(s.title || '', {
      x: titleX, y: titleY, w: 8.8, h: 1.4,
      fontSize: titleSize,
      fontFace: isPinvest ? 'Garamond' : font,
      bold: true, color: titleColor,
      align: isCenter ? 'center' : 'left',
      valign: 'middle',
    })

    // Gold rule under title for Pinvest
    if (isPinvest && !isCenter) {
      slide.addShape(pptx.ShapeType.rect, { x: 0.65, y: 1.85, w: 1.2, h: 0.01, fill: { color: accentHex } })
    }

    const contentStartY = isCenter ? 3.8 : 2.1
    const bullets = (s.content || '').split('\n').filter(Boolean)
    bullets.forEach((b, bi) => {
      const clean = b.replace(/^[•\-◆]\s*/, '')
      slide.addText(clean, {
        x: titleX, y: contentStartY + bi * 0.55, w: 8.3, h: 0.5,
        fontSize: isPinvest ? 17 : 18,
        fontFace: isPinvest ? 'Garamond' : 'Calibri',
        color: bodyColor,
        bullet: isCenter ? false : { type: 'bullet', characterCode: isPinvest ? '25C6' : '25CF', indent: 20 },
        align: isCenter ? 'center' : 'left',
      })
    })

    if (s.notes) slide.addNotes(s.notes)
  })

  await pptx.writeFile({ fileName: `${pres.title || 'presentation'}.pptx` })
}

function exportHTML(pres: Presentation) {
  const theme = getTheme(pres.theme)
  const isPinvest = pres.theme === 'pinvest'
  const accent = pres.accent || theme.accentOverride || '#0ACF83'
  const isDark = ['dark', 'gradient', 'pinvest'].includes(pres.theme)
  const bg = isPinvest ? '#0d0e11' : isDark ? '#0d0f0e' : '#ffffff'
  const titleCol = isPinvest ? '#f5f2ec' : isDark ? '#f5f7f6' : '#0d0f0e'
  const bodyCol = isPinvest ? '#c5bfb3' : isDark ? '#9ba09d' : '#3a3d3b'
  const fontFamily = isPinvest ? "'Cormorant Garamond', 'Garamond', serif" : `'${pres.font || 'Syne'}', sans-serif`

  const slidesHTML = pres.slides.map((s, i) => {
    const bullets = (s.content || '').split('\n').filter(Boolean)
      .map(b => `<p class="bullet">${b.replace(/^[•\-◆]\s*/, '')}</p>`).join('')
    const isCenter = ['centered', 'pinvest-title', 'pinvest-closing'].includes(s.layout)
    return `<div class="slide${i === 0 ? ' active' : ''}" id="s${i}" style="text-align:${isCenter ? 'center' : 'left'}">
  ${isPinvest ? '<div class="pinvest-top-rule"></div><div class="pinvest-logo">PINVEST CAPITAL</div>' : ''}
  <div class="accent-bar" style="${isCenter ? 'margin:0 auto 24px' : 'margin-bottom:20px'}"></div>
  <h1>${s.title || ''}</h1>
  <div class="content">${bullets}</div>
  ${isPinvest ? `<div class="pinvest-footer">◆ CONFIDENTIAL  |  ${i + 1} / ${pres.slides.length}</div>` : ''}
</div>`
  }).join('\n')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${pres.title || 'Presentation'}</title>
${isPinvest ? `<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&display=swap" rel="stylesheet">` : `<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400&display=swap" rel="stylesheet">`}
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:${isDark ? '#1a1a1a' : '#e8ecea'};font-family:${fontFamily}}
.slide{width:100vw;height:100vh;background:${bg};display:none;flex-direction:column;justify-content:center;padding:8vw 10vw;position:relative;overflow:hidden}
.slide.active{display:flex}
.accent-bar{width:40px;height:4px;background:${accent};border-radius:2px}
h1{font-family:${fontFamily};font-size:clamp(28px,4.5vw,64px);color:${titleCol};margin-bottom:24px;font-weight:${isPinvest ? 600 : 800};line-height:1.1;letter-spacing:${isPinvest ? '-0.5px' : '-1px'}}
.content{display:flex;flex-direction:column;gap:12px}
.bullet{font-size:clamp(14px,1.8vw,22px);color:${bodyCol};line-height:1.7;font-weight:300;padding-left:${isPinvest ? '0' : '0'}}
.bullet::before{content:'${isPinvest ? '◆' : '•'}  ';color:${accent};font-size:0.7em}
${isPinvest ? `.pinvest-top-rule{position:absolute;top:0;left:0;right:0;height:3px;background:${accent}}
.pinvest-logo{position:absolute;top:20px;right:48px;font-size:11px;letter-spacing:.25em;color:${accent};font-family:monospace}
.pinvest-footer{position:absolute;bottom:16px;left:0;right:0;text-align:center;font-size:9px;letter-spacing:.2em;color:${accent};font-family:monospace}` : ''}
.controls{position:fixed;bottom:20px;right:20px;display:flex;gap:8px;z-index:10}
.controls button{background:${accent};color:white;border:none;border-radius:8px;padding:10px 18px;cursor:pointer;font-size:14px;font-family:inherit}
.counter{position:fixed;bottom:26px;left:20px;font-size:12px;color:${bodyCol};font-family:monospace;letter-spacing:.1em}
</style>
</head>
<body>
${slidesHTML}
<div class="counter" id="cnt">1 / ${pres.slides.length}</div>
<div class="controls">
  <button onclick="go(-1)">← Prev</button>
  <button onclick="go(1)">Next →</button>
</div>
<script>
let c=0;
function go(d){
  document.getElementById('s'+c).classList.remove('active');
  c=Math.max(0,Math.min(${pres.slides.length-1},c+d));
  document.getElementById('s'+c).classList.add('active');
  document.getElementById('cnt').textContent=(c+1)+' / ${pres.slides.length}';
}
document.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key===' ')go(1);if(e.key==='ArrowLeft')go(-1)});
<\/script>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${pres.title || 'presentation'}.html`
  a.click()
}

function exportJSON(pres: Presentation) {
  const blob = new Blob([JSON.stringify(pres, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${pres.title || 'presentation'}.json`
  a.click()
}

function exportDOCX(pres: Presentation) {
  const text = pres.slides.map((s, i) =>
    `SLIDE ${i + 1}: ${s.title || ''}\n${'─'.repeat(50)}\n${s.content || ''}\n\nSpeaker Notes:\n${s.notes || '(none)'}\n`
  ).join('\n\n')

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${pres.title || 'presentation'}.txt`
  a.click()
}

function exportPDF(_pres: Presentation) {
  window.print()
}

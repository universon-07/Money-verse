export interface PlaybookData {
  heading: string
  title: string
  name: string
  rulesHeading: string
  rules: string[]
  stepsHeading: string
  steps: string[]
  clueHeading: string
  clues: string[]
  tell: string
  help: string
  fake: string
}

const W = 1080
const H = 1350

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  // split on spaces; scripts without spaces (long Telugu words) still break by character below
  const out: string[] = []
  for (const para of text.split('\n')) {
    let line = ''
    for (const word of para.split(' ')) {
      const test = line ? `${line} ${word}` : word
      if (ctx.measureText(test).width <= maxW) line = test
      else {
        if (line) out.push(line)
        line = word
      }
    }
    if (line) out.push(line)
  }
  return out
}

/** The shareable Playbook card (spec 6.7): drawn on the device, no network, no personal data beyond the nickname. */
export async function drawPlaybook(canvas: HTMLCanvasElement, d: PlaybookData): Promise<void> {
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  try {
    await Promise.all([
      document.fonts.load('600 32px "Noto Sans"', d.rules.join(' ')), document.fonts.load('900 32px "Noto Sans Telugu"', d.rules.join(' ')),
    ])
  } catch { /* fonts fall back */ }
  const ink = '#3A2A24'
  ctx.fillStyle = '#F8EBCB'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#92C9D3'
  ctx.fillRect(0, 0, W, 210)
  ctx.fillStyle = '#3A2A24'
  ctx.fillRect(0, 206, W, 4)
  ctx.strokeStyle = '#3A2A24'
  ctx.lineWidth = 4
  ctx.strokeRect(18, 18, W - 36, H - 36)

  ctx.fillStyle = ink
  ctx.textBaseline = 'top'
  ctx.font = '400 62px "DM Serif Display", Georgia, "Noto Sans Telugu", "Noto Sans Telugu", sans-serif'
  ctx.fillText(d.heading, 60, 50)
  ctx.fillStyle = '#3A2A24'
  ctx.font = '700 34px "Noto Sans", "Noto Sans Telugu", sans-serif'
  ctx.fillText(`${d.name} · ${d.title}`, 60, 140)

  let y = 240
  const body = '600 31px "Noto Sans", "Noto Sans Telugu", sans-serif'
  const label = '800 28px "Noto Sans", "Noto Sans Telugu", sans-serif'
  const section = (head: string, color: string) => {
    ctx.fillStyle = color
    ctx.font = label
    ctx.fillText(head, 60, y)
    y += 48
    ctx.fillStyle = ink
    ctx.font = body
  }
  section(d.rulesHeading, '#C4452F')
  for (const r of d.rules) for (const l of wrap(ctx, '• ' + r, W - 120)) { ctx.fillText(l, 60, y); y += 40 }
  y += 14
  section(d.stepsHeading, '#C4452F')
  const stepLine = d.steps.map((s, i) => `${i + 1}. ${s}`).join('   ')
  for (const l of wrap(ctx, stepLine, W - 120)) { ctx.fillText(l, 60, y); y += 40 }
  y += 14
  if (d.clues.length) {
    section(d.clueHeading, '#C4452F')
    for (const c of d.clues.slice(0, 3)) for (const l of wrap(ctx, '• ' + c, W - 120)) { ctx.fillText(l, 60, y); y += 38 }
    y += 14
  }
  ctx.fillStyle = ink
  ctx.font = '800 32px "Noto Sans", "Noto Sans Telugu", sans-serif'
  for (const l of wrap(ctx, '[  ] ' + d.tell, W - 120)) { ctx.fillText(l, 60, y); y += 42 }
  y += 10
  ctx.font = body
  for (const l of wrap(ctx, d.help, W - 120)) { ctx.fillText(l, 60, y); y += 38 }

  ctx.font = '600 26px "Noto Sans", "Noto Sans Telugu", sans-serif'
  ctx.fillStyle = '#7A6658'
  ctx.fillText(d.fake, 60, H - 70)
}

export function canvasToBlob(c: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((res) => c.toBlob(res, 'image/png'))
}

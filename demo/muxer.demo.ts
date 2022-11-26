import { record } from '../src'

const cvsEl = document.getElementById('canvas') as HTMLCanvasElement
const stop = record(
  cvsEl,
  () => {}
)

;(function init () {
  const ctx2d = cvsEl.getContext('2d')
  if (ctx2d == null) return
  setInterval(function () {
    ctx2d.fillStyle = `rgba(${rand255()},${rand255()},${rand255()},0.5)`
    ctx2d.fillRect(0, 0, ctx2d.canvas.width, ctx2d.canvas.height)
  }, 1000)

  function rand255 (): number {
    return Math.round(Math.random() * 255)
  }

  document.getElementById('stop')?.addEventListener('click', stop)
})()

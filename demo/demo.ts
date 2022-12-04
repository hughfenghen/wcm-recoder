import mp4box from 'mp4box'
import { record } from '../src'

const cvsEl = document.getElementById('canvas') as HTMLCanvasElement
const videoEl = document.getElementById('video') as HTMLVideoElement
const ms = new MediaSource()

;(async function init () {
  const ctx2d = cvsEl.getContext('2d')
  if (ctx2d == null) return
  setInterval(function () {
    ctx2d.fillStyle = `rgba(${rand255()},${rand255()},${rand255()},0.5)`
    ctx2d.fillRect(0, 0, ctx2d.canvas.width, ctx2d.canvas.height)
  }, 1000)

  const stream = await record(
    cvsEl,
    { fps: 30 }
  )

  videoEl.src = URL.createObjectURL(ms)
  ms.addEventListener('sourceopen', console.log)
  ms.addEventListener('sourceended', console.log)

  loadData(stream.getReader())
  document.getElementById('play')?.addEventListener('click', () => {
    videoEl.play()
  })
  // document.getElementById('stop')?.addEventListener('click', stop)
})()

function rand255(): number {
  return Math.round(Math.random() * 255)
}


let segs: ArrayBuffer[] = []
const mfile = mp4box.createFile()
mfile.onReady = (info) => {
  console.log('---- mp4 info', info, info.tracks[0].id)

  addBuffer(info.tracks[0])
  mfile.start();
}

function addBuffer (track) {
  const mime = 'video/mp4; codecs=\"' + track.codec + '\"'
  const sb = ms.addSourceBuffer(mime)
  sb.addEventListener("updateend", onUpdateend);
  mfile.onSegment = function (id, user, buffer, sampleNumber, last) {
    segs.push(buffer)
  }
  mfile.setSegmentOptions(track.id, sb, { nbSamples: 10 });
  const initSegs = mfile.initializeSegmentation()
  initSegs.forEach(({ buffer }) => {
    sb.appendBuffer(buffer)
  })
  console.log('---- init segs: ', initSegs, ms, mime)
}

function onUpdateend (evt) {
  const { target: sb } = evt
  if (ms.readyState === 'open' && sb.updating === false && segs.length > 0) {
    sb.appendBuffer(segs.shift())
  } else {
    setTimeout(() => {
      onUpdateend(evt)
    }, 16)
  }
}

let offset = 0
async function loadData(reader: ReadableStreamDefaultReader) {
  const { done, value } = await reader.read()
  if (done) return

  value.fileStart = offset
  offset = mfile.appendBuffer(value)
  await loadData(reader)
}

function download(filename: string, buffers: ArrayBuffer[]): void {
  const blob = new Blob(buffers)
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  // Required in Firefox
  document.body.appendChild(a)
  a.setAttribute('href', url)
  a.setAttribute('download', filename)
  // Required in Firefox
  a.setAttribute('target', '_self')
  a.click()
  window.URL.revokeObjectURL(url)
}
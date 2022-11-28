import { record } from '../src'

const cvsEl = document.getElementById('canvas') as HTMLCanvasElement
const videoEl = document.getElementById('video') as HTMLVideoElement

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

  videoEl.src = URL.createObjectURL(convertStream2MediaSource(stream))

  // logStream(stream.getReader())

  document.getElementById('play')?.addEventListener('click', () => {
    // videoEl.src = URL.createObjectURL(new Blob([move]))
    videoEl.play()
    // download('abc.mp4', move)
  })
  // document.getElementById('stop')?.addEventListener('click', stop)
})()

function rand255(): number {
  return Math.round(Math.random() * 255)
}

let move = new ArrayBuffer(0)
let c = 0
async function logStream(reader: ReadableStreamDefaultReader) {
  if (c > 0) return
  const { done, value } = await reader.read()
  if (done) return
  move = concatAB(move, value)
  c += 1
  // console.log(3333, value)
  await logStream(reader)
}

function convertStream2MediaSource(stream: ReadableStream): MediaSource {
  const ms = new MediaSource()
  const reader = stream.getReader()
  // const mimeCodec = 'video/mp4; codecs="avc1.42E01F,mp4a.40.2"';
  const mimeCodec = 'video/mp4; codecs="avc1.42E01F"';

  let sourceBuffer
  ms.addEventListener('sourceopen', async () => {
    console.log(66666, 'sourceopen')
    sourceBuffer = ms.addSourceBuffer(mimeCodec)
    await updateSB()

    sourceBuffer.addEventListener('update', async () => {
      console.log('sb updateend, ms state: ', ms.readyState)
      // ms.endOfStream('decode')
      // await updateSB()
    })
  });
  ms.addEventListener('sourceclose', (evt) => {
    console.log(7777, evt, ms.readyState, ms.sourceBuffers)
  })
  ms.addEventListener('sourceended', (evt) => {
    console.log(88888, evt, ms.readyState, ms.sourceBuffers)
  })

  // const timerId = setTimeout(() => {
  //   ms.endOfStream('decode')
  // }, 2000)

  async function updateSB () {
    const { done, value } = await reader.read()
    if (done) return
    console.log('----- add buf', value, ms.readyState, sourceBuffer.updating)
    if (sourceBuffer.updating) {
      console.error('---------- updating ---------')
    } else {
      sourceBuffer.appendBuffer(value)
    }
    console.log('----- afater add buf', ms.readyState, sourceBuffer.updating)
    // updateSB()
  }
 
  return ms
}

function concatAB(buffer1: ArrayBuffer, buffer2: ArrayBuffer): ArrayBuffer {
  if (buffer1 == null) return buffer2 == null ? new ArrayBuffer(0) : buffer2

  const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength)
  tmp.set(new Uint8Array(buffer1), 0)
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength)
  return tmp.buffer
};

function download(filename: string, buffer: ArrayBuffer): void {
  const blob = new Blob([buffer])
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
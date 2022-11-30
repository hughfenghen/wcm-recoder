import mp4box from 'mp4box'
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

  // videoEl.src = URL.createObjectURL(convertStream2MediaSource(stream))
  console.log(99999, videoEl.src)

  logStream(stream.getReader())

  document.getElementById('play')?.addEventListener('click', () => {
    // videoEl.src = URL.createObjectURL(new Blob([move]))
    videoEl.play()
    download('abc.mp4', segs)
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
  mfile.onSegment = function (id, user, buffer, sampleNumber, last) {
    segs.push(buffer)
    // console.log(5555, { id, user, buffer, sampleNumber, last })
  }
  mfile.setSegmentOptions(info.tracks[0].id, null, { nbSamples: 10 });
  var initSegs = mfile.initializeSegmentation();
  segs.push(initSegs[0].buffer)
  console.log('---- init segs: ', initSegs, segs)
  mfile.start();
}

let count = 0
let offset = 0
async function logStream(reader: ReadableStreamDefaultReader) {
  // if (count > 1) return
  const { done, value } = await reader.read()
  if (done) return
  // console.log(444444, value)
  // download('111.mp4', value)
  // count += 1

  value.fileStart = offset
  offset = mfile.appendBuffer(value)
  await logStream(reader)
}

function convertStream2MediaSource(stream: ReadableStream): MediaSource {
  const ms = new MediaSource()
  // const reader = stream.getReader()
  const mimeCodec = 'video/mp4; codecs="avc1.42E01E,mp4a.40.2"';
  // const mimeCodec = 'video/mp4; codecs="avc1.42E01F"';

  ms.addEventListener('sourceopen', async () => {
    const sourceBuffer = ms.addSourceBuffer(mimeCodec)
    console.log('------ sourceopen, sb mode: ', sourceBuffer.mode)
    // videoEl.play()

    function readData() {
      console.log('----- readData', sourceBuffer.updating, segs.length)
      if (segs.length === 0) {
        const timerId = setTimeout(() => {
          readData()
        }, 500)
        return
      }
      if (!sourceBuffer.updating && segs.length > 0) {
        const bufs = segs.reduce(
          (acc, cur) => concatAB(acc, cur), 
          new Uint8Array(0)
        )
        const u8 = new Uint8Array(bufs)
        // u8.set([1,1,1,1], 0)
        sourceBuffer.appendBuffer(bufs)
        console.log(33333334, bufs, sourceBuffer.buffered)
        segs = []
      }
    }

    sourceBuffer.addEventListener('error', console.error)
    sourceBuffer.addEventListener('abort', console.error)
    sourceBuffer.addEventListener('updatestart', console.error)
    sourceBuffer.addEventListener('update', console.error)
    sourceBuffer.addEventListener('updateend', async () => {
      console.log('sb updateend, ms state: ', ms.readyState)
      readData()
    })

    const timerId = setTimeout(() => {
      readData()
    }, 2000)
  });
  ms.addEventListener('sourceclose', (evt) => {
    console.log(7777, evt, ms.readyState, ms.sourceBuffers)
  })
  ms.addEventListener('sourceended', (evt) => {
    console.log(88888, evt, ms.readyState, ms.sourceBuffers)
  })

  return ms
}

function concatAB(buffer1: ArrayBuffer, buffer2: ArrayBuffer): ArrayBuffer {
  if (buffer1 == null) return buffer2 == null ? new ArrayBuffer(0) : buffer2

  const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength)
  tmp.set(new Uint8Array(buffer1), 0)
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength)
  return tmp.buffer
};

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
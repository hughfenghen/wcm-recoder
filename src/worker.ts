import mp4box from 'mp4box'
import { IEncoderConf } from './interface'

console.log(mp4box)

enum State {
  Preparing = 'preparing',
  Running = 'running',
  Paused = 'paused',
  Stopped ='stopped'
}

let STATE = State.Preparing
let encoder: VideoEncoder
let imgBitmapHandler: (img: ImageBitmap) => void

self.onmessage = (evt: MessageEvent) => {
  const { type, data } = evt.data
  switch (type) {
    case 'start':
      if (STATE === State.Preparing) init(evt.data)
      break
    // todo
    case 'pause':
    case 'stop':
      break
    case 'ImageBitmap':
      console.log('ImageBitmap', data)
      imgBitmapHandler(data)
      break
  }
}

function init (opts: IEncoderConf): void {
  STATE = State.Running

  encoder = new VideoEncoder({
    error: (err) => {
      console.error('VideoEncoder error : ', err)
    },
    output: encoderOutputHandler
  })

  encoder.configure({
    codec: 'avc1.42E01F',
    width: opts.width,
    height: opts.height,
    framerate: opts.fps,
    hardwareAcceleration: 'prefer-hardware',
    // 码率
    bitrate: 3_000_000,
    // mac 自带播放器只支持avc
    // avc: { format: 'avc' }
    avc: { format: 'annexb' }
  })

  setInterval(() => {
    self.postMessage({ type: 'getImageBitmap' })
    imgBitmapHandler = createImgBitmapHandler()
  }, 1000 / opts.fps)
}

const encoderOutputHandler: EncodedVideoChunkOutputCallback = (
  chunk, meta
): void => {
  console.log(3333, chunk, meta)
}

const createImgBitmapHandler = (): (img: ImageBitmap) => void => {
  let frameCount = 0
  const startTime = performance.now()
  let lastTime = performance.now()

  return (img) => {
    const now = performance.now()
    const vf = new VideoFrame(img, {
      timestamp: now - startTime,
      duration: now - lastTime
    })
    lastTime = now

    // todo：关键帧间隔可配置
    encoder.encode(vf, { keyFrame: frameCount % 150 === 0 })
    vf.close()
    frameCount += 1
  }
}

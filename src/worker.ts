import mp4box, { MP4File } from 'mp4box'
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
      if (STATE === State.Preparing) init(data)
      break
    // todo
    case 'pause':
    case 'stop':
      break
    case 'ImageBitmap':
      // console.log('ImageBitmap', data)
      imgBitmapHandler(data)
      break
  }
}

function init (opts: IEncoderConf): void {
  STATE = State.Running

  const outHandler = createOutHandler(opts)
  encoder = new VideoEncoder({
    error: (err) => {
      console.error('VideoEncoder error : ', err)
    },
    output: outHandler.handler
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

  imgBitmapHandler = createImgBitmapHandler(encoder)
  setInterval(() => {
    self.postMessage({ type: 'getImageBitmap' })
  }, 1000 / opts.fps)
}

const createOutHandler: (opts: IEncoderConf) => {
  handler: EncodedVideoChunkOutputCallback
  outputFile: MP4File
} = (opts) => {
  const outputFile = mp4box.createFile()
  const timescale = 1_000_000
  const videoEncodingTrackOptions = {
    // 微秒
    timescale,
    width: opts.width,
    height: opts.height,
    brands: ['isom', 'iso2', 'avc1', 'mp41'],
    avcDecoderConfigRecord: null as AllowSharedBufferSource | undefined | null
  }

  let vTrackId: number
  const startTime = performance.now()
  const lastTime = startTime
  return {
    outputFile,
    handler: (chunk, meta) => {
      if (vTrackId == null) {
        videoEncodingTrackOptions.avcDecoderConfigRecord = meta.decoderConfig?.description
        vTrackId = outputFile.addTrack(videoEncodingTrackOptions)
      }
      const buf = new ArrayBuffer(chunk.byteLength)
      chunk.copyTo(buf)

      const now = performance.now()
      const dts = (now - startTime) * 1000
      // todo: insert sei
      outputFile.addSample(
        vTrackId,
        buf,
        {
          // 每帧时长，单位微秒
          duration: (now - lastTime) * 1000,
          dts,
          cts: dts,
          is_sync: chunk.type === 'key'
        }
      )
    }
  }
}

const createImgBitmapHandler = (
  encoder: VideoEncoder
): (img: ImageBitmap) => void => {
  let frameCount = 0
  const startTime = performance.now()
  let lastTime = startTime

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

// init (ImageBitmap) -> encoder -> outputhandler (h264) -> mp4box (mp4)

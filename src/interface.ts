export interface IEncoderConf {
  width: number
  height: number
  fps: number
  videoFrameStream: ReadableStream<VideoFrame>
}

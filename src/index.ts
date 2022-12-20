import MyWorker from './worker?worker&inline'

export async function record (
  sourceEl: HTMLCanvasElement,
  opts: { fps: number }
): Promise<ReadableStream> {
  const worker = new MyWorker()
  const tracks = sourceEl.captureStream().getVideoTracks()
  const trackProcessor = new MediaStreamTrackProcessor({
    track: tracks[0]
  })
  const videoFrameStream = trackProcessor.readable
  worker.postMessage({
    type: 'start',
    data: {
      fps: opts.fps,
      width: sourceEl.width,
      height: sourceEl.height,
      videoFrameStream
    }
  }, [videoFrameStream])

  let rsResolve
  worker.onmessage = async (evt: MessageEvent) => {
    const { type, data } = evt.data
    switch (type) {
      case 'outputStream':
        rsResolve(data as ReadableStream)
        break
    }
  }
  return await new Promise((resolve) => {
    rsResolve = resolve
  })
}

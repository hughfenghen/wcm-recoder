import MyWorker from './worker?worker&inline'

export async function record (
  sourceEl: HTMLCanvasElement,
  opts: { fps: number }
): Promise<ReadableStream> {
  const worker = new MyWorker()
  worker.postMessage({
    type: 'start',
    data: {
      fps: opts.fps,
      width: sourceEl.width,
      height: sourceEl.height
    }
  })

  let rsResolve
  worker.onmessage = async (evt: MessageEvent) => {
    const { type, data } = evt.data
    let img
    switch (type) {
      case 'getImageBitmap':
        img = await createImageBitmap(sourceEl)
        worker.postMessage({
          type: 'ImageBitmap',
          data: img
        }, [img])
        break
      case 'outputStream':
        rsResolve(data as ReadableStream)
        break
    }
  }
  return await new Promise((resolve) => {
    rsResolve = resolve
  })
}

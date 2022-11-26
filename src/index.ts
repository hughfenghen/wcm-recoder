import MyWorker from './worker?worker&inline'

export function record (
  sourceEl: HTMLCanvasElement
): void {
  const worker = new MyWorker()
  worker.postMessage({
    type: 'start'
  })

  worker.onmessage = async (evt: MessageEvent) => {
    const { type } = evt.data
    let img
    switch (type) {
      case 'getImageBitmap':
        img = await createImageBitmap(sourceEl)
        worker.postMessage({
          type: 'ImageBitmap',
          data: img
        }, [img])
    }
  }
}

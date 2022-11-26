import mp4box from 'mp4box'

console.log(mp4box)

enum State {
  Preparing = 'preparing',
  Running = 'running',
  Paused = 'paused',
  Stopped ='stopped'
}

let STATE = State.Preparing

self.onmessage = (evt: MessageEvent) => {
  const { type } = evt.data
  switch (type) {
    case 'start':
      if (STATE === State.Preparing) init(evt.data)
      break
    case 'ImageBitmap':
      console.log('ImageBitmap', evt.data)
      break
  }
}

function init (opts: { fps: number }): void {
  STATE = State.Running

  setInterval(() => {
    self.postMessage({ type: 'getImageBitmap' })
  }, 1000 / opts.fps)
}

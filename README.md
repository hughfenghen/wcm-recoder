# wcm-recoder

## Deprecate: This is a simple example that is no longer maintained, please use [@webav/av-recorder](https://github.com/hughfenghen/WebAV/blob/main/packages/av-recorder/README.md)  

Use mp4box.js + webcodecs mux to mp4 file and play it with MSE.  

The data flow:  
canvas captureStream -> MediaStreamTrackProcessor.readable -> mp4box.js + webcodecs (run in webworker) -> ReadableStream(mp4 ArrayBuffer, can be pushed to server) -> mp4box.js -> Segment ArrayBuffer -> video element + MSE  

Run sample:  
`yarn install`  
`yarn dev` 

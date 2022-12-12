# wcm-recoder
Use mp4box.js + webcodecs mux to mp4 file and play it with MSE.  

The data flow:  
canvas ImageBitmap -> mp4box.js + webcodecs (run in webworker) -> ReadableStream(mp4 ArrayBuffer, can be pushed to the server) -> mp4box.js -> Segment ArrayBuffer -> video element + MSE  

Run sample:  
`yarn install`  
`yarn dev` 

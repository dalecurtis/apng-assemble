# apng-assemble
Simple demo assembling APNGs from an HTML5 canvas.

[Demo](https://dalecurtis.github.io/apng-assemble/)

Since [APNG](https://wiki.mozilla.org/APNG_Specification#Structure) is a simple
extension of [PNG](https://en.wikipedia.org/wiki/PNG), we can assemble animated
images using individual PNGs encoded by[canvas.toBlob()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)
and [offscreenCanvas.convertToBlob()](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas/convertToBlob).

A PNG contains a couple metadata chunks and then image data as one or more
`IDAT` chunks. APNG just adds a few new chunks: `acTL`, 'fcTL' and 'fdAT'. The
last of which is just an `IDAT` with a sequence number added.

This demo works by slicing the image data out of each image and applying a minor
transform to change it into the format expected by APNG.[Wikipedia](https://en.wikipedia.org/wiki/APNG#File_format) has an excellent diagram of
what this transform looks like.

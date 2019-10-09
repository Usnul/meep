/**
 * Created by Alex on 16/10/2014.
 */



export default function loadImage(url, callback) {
    const img = new Image();
    img.onload = function () {
        const imgWidth = img.width;
        const imgHeight = img.height;
        //
        const canvas = document.createElement('canvas');
        canvas.width = imgWidth;
        canvas.height = imgHeight;
        const context = canvas.getContext('2d');

        context.drawImage(img, 0, 0, imgWidth, imgHeight);
        const imgd = context.getImageData(0, 0, imgWidth, imgHeight);

        callback({
            width: imgWidth,
            height: imgHeight,
            data: imgd.data,
            canvas: canvas
        });
    };
    img.onerror = function () {
        console.error("failed to load image " + url);
    };
    // load img source
    img.src = url;
};

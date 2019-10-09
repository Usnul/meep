/**
 * Created by Alex on 26/04/2015.
 */
export default function (canvas) {
    const dataURL = canvas.toDataURL("image/png;base64;");
    window.open(dataURL, "", "width=" + canvas.width + ",height=" + canvas.height);
};
import loadImage from 'blueimp-load-image';

export const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    loadImage(
      file,
      (img) => {
        if (img instanceof HTMLCanvasElement) {
          resolve(img.toDataURL());
        } else {
          reject(new Error('Failed to convert image to base64'));
        }
      },
      { canvas: true }
    );
  });
};

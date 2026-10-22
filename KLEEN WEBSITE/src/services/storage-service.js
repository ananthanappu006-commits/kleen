/**
 * KLEEN — Storage Service
 * Handles KYC document and profile photo uploads with instant preview and metadata tracking.
 */

class StorageService {
  /**
   * Uploads a file (KYC document, selfie, or profile picture)
   * @param {File} file
   * @param {string} storagePath
   * @returns {Promise<{storagePath: string, fileName: string, fileUrl: string, uploadedAt: string}>}
   */
  async uploadFile(file, storagePath) {
    return new Promise((resolve, reject) => {
      if (!file) {
        return reject(new Error("No file selected for upload."));
      }

      // Max size: 10MB
      if (file.size > 10 * 1024 * 1024) {
        return reject(new Error("File size exceeds maximum allowed limit of 10MB."));
      }

      // If image file, compress via canvas to avoid exceeding browser storage quota
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const maxDim = 1000;
            let width = img.width;
            let height = img.height;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);

            // Compress to web-friendly JPEG
            const compressedUrl = canvas.toDataURL("image/jpeg", 0.85);
            resolve({
              storagePath,
              fileName: file.name,
              fileUrl: compressedUrl,
              fileSize: Math.round(compressedUrl.length * 0.75),
              fileType: "image/jpeg",
              uploadedAt: new Date().toISOString()
            });
          };
          img.onerror = () => {
            // Fallback to raw data url if image decode fails
            resolve({
              storagePath,
              fileName: file.name,
              fileUrl: e.target.result,
              fileSize: file.size,
              fileType: file.type,
              uploadedAt: new Date().toISOString()
            });
          };
          img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error("Failed to read image file."));
        reader.readAsDataURL(file);
        return;
      }

      // Non-image files (PDFs, etc.)
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          storagePath,
          fileName: file.name,
          fileUrl: e.target.result,
          fileSize: file.size,
          fileType: file.type,
          uploadedAt: new Date().toISOString()
        });
      };
      reader.onerror = () => reject(new Error("Failed to read the file."));
      reader.readAsDataURL(file);
    });
  }
}

export const storage = new StorageService();

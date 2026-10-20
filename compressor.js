/**
 * Kompresi Gambar Otomatis di Sisi Klien (Browser)
 * Menurunkan ukuran file foto hingga target di bawah 50 KB
 */
async function compressImageFile(file, maxWidth = 400, initialQuality = 0.4) {
    return new Promise((resolve, reject) => {
        // Jika bukan gambar, kembalikan file asli
        if (!file.type.startsWith('image/')) {
            resolve(file);
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Skala proporsional untuk memperkecil resolusi awal
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const targetBytes = 50 * 1024; // 50 KB
                let quality = initialQuality;

                const attemptCompression = (currentQuality) => {
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                resolve(file);
                                return;
                            }

                            // Jika ukuran masih di atas 50 KB dan kualitas masih bisa diturunkan, kurangi kualitasnya lagi
                            if (blob.size > targetBytes && currentQuality > 0.1) {
                                attemptCompression(currentQuality - 0.1);
                                return;
                            }

                            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            });

                            console.log(`[Kompresi] Ukuran Asli: ${(file.size / 1024).toFixed(1)} KB -> Hasil: ${(compressedFile.size / 1024).toFixed(1)} KB`);
                            resolve(compressedFile);
                        },
                        'image/jpeg',
                        currentQuality
                    );
                };

                attemptCompression(quality);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

/**
 * Validasi File sebelum diunggah
 * Batas Maksimal File (Dokumen/Gambar): 200 KB
 */
async function processAndValidateFile(fileInput) {
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        return null;
    }

    let file = fileInput.files[0];
    const fileNameLower = file.name.toLowerCase();

    // 1. Jika File Adalah Gambar, Lakukan Auto Kompresi Target < 50 KB
    if (file.type.startsWith('image/') || fileNameLower.match(/\.(jpg|jpeg|png)$/)) {
        try {
            file = await compressImageFile(file, 400, 0.4); 
        } catch (e) {
            console.warn('Gagal kompres gambar, menggunakan file asli:', e);
        }
    }

    // 2. Batas Maksimal Ukuran File Absolut: 200 KB
    const MAX_SIZE_BYTES = 200 * 1024; // 200 KB
    if (file.size > MAX_SIZE_BYTES) {
        alert(`Ukuran file terlalu besar (${(file.size / 1024).toFixed(1)} KB)!\n\nBatas maksimal ukuran file yang diizinkan adalah 200 KB.`);
        return false;
    }

    return file;
}

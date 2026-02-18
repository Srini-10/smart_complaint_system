import imageCompression from 'browser-image-compression';

/**
 * Compress an image file before upload
 * Target: < 500KB, max 1200px width
 */
export async function compressImage(file: File): Promise<File> {
    const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/webp',
    };

    try {
        const compressed = await imageCompression(file, options);
        return compressed;
    } catch {
        // Return original if compression fails
        return file;
    }
}

/**
 * Convert File to base64 data URL for preview
 */
export function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Validate image file type and size
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 10 * 1024 * 1024; // 10MB before compression

    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'Only JPEG, PNG, WebP, and GIF images are allowed.' };
    }

    if (file.size > maxSize) {
        return { valid: false, error: 'Image size must be less than 10MB.' };
    }

    return { valid: true };
}

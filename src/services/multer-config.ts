import multer from 'multer';

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, 'uploads/');
    },

    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now();

        cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
});

export const upload = multer({
    storage,
});
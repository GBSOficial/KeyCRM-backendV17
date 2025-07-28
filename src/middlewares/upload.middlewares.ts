import multer from 'multer';
import path from 'path';
import { AppError } from '../errors/appError';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/temp'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/json'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(415, 'Formato de arquivo inválido. Use CSV, XLS, XLSX ou JSON'));
  }
};

const limits = {
  fileSize: 5 * 1024 * 1024, // 5MB
};

export const uploadConfig = multer({
  storage,
  fileFilter,
  limits,
}); 
import { z } from "zod";

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

export const createAttachmentSchema = z.object({
  fileName: z
    .string()
    .trim()
    .min(1,   "File name is required")
    .max(255, "File name must not exceed 255 characters"),

  fileUrl: z
    .string()
    .trim()
    .url("fileUrl must be a valid URL")
    .max(2048, "File URL must not exceed 2048 characters"),

  fileType: z
    .string()
    .trim()
    .min(1,   "File type is required")
    .max(100, "File type must not exceed 100 characters")
    .regex(
      /^[\w!#$&\-^]+\/[\w!#$&\-^.+]+$/,
      "fileType must be a valid MIME type (e.g. image/png)"
    ),

  fileSize: z
    .number({ error: "fileSize must be a number" })
    .int("fileSize must be an integer")
    .min(1,                    "fileSize must be at least 1 byte")
    .max(MAX_FILE_SIZE_BYTES,  `fileSize must not exceed ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB`),
});

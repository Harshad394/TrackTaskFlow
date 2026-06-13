import { z } from "zod";

const queryNumber = (defaultValue: number, max: number) => {
  return z.preprocess(
    (value) => {
      if (Array.isArray(value)) {
        return value[0] ? Number(value[0]) : defaultValue;
      }

      if (value === undefined || value === null || value === "") {
        return defaultValue;
      }

      return Number(value);
    },
    z.number().int().min(1).max(max)
  );
};

export const paginationSchema = z.object({
  page: queryNumber(1, 100000),
  limit: queryNumber(20, 100),
});

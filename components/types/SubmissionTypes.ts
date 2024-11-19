import { z } from "zod";
export const SubmissionMediaInfo = z.object({
    url: z.string(),
    name: z.string(),
    size: z.number(),
    type: z.string(),
});

export type SubmissionMediaInfoType = z.TypeOf<typeof SubmissionMediaInfo>;

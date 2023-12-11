import type { Response as BaseResponse } from "express";

export interface PlatformApiLocals extends Record<string, unknown> {
  apiKey?: {
    hashedKey: string;
    id: string;
    userId: number;
    teamId: number;
  };
}

export type Response = BaseResponse<unknown, PlatformApiLocals>;
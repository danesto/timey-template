import { NextResponse } from "next/server";

export type ApiError = { error: string; message: string };

export const ok = <T>(data: T, init?: ResponseInit) =>
  NextResponse.json(data, init);

export const fail = (status: number, error: string, message: string) =>
  NextResponse.json<ApiError>({ error, message }, { status });

export const badRequest = (message: string) =>
  fail(400, "bad_request", message);

export const notFound = (message = "Not found.") =>
  fail(404, "not_found", message);

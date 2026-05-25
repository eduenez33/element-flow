import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema/index.js";
import type { RegisterInput, LoginInput } from "@element-flow/shared";
import { AppError } from "../lib/errors.js";

export type TokenPayload = {
  userId: string;
  email: string;
};

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ||
  "15m") as `${number}${"s" | "m" | "h" | "d" | "w" | "y"}`;
const JWT_REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN ||
  "7d") as `${number}${"s" | "m" | "h" | "d" | "w" | "y"}`;

const DUMMY_HASH = "$2a$10$invalidhashinvalidhashinvalid.";

const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  } catch {
    throw new AppError(
      401,
      "INVALID_REFRESH_TOKEN",
      "Invalid or expired refresh token",
    );
  }
};

const generateTokens = (payload: TokenPayload) => {
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });
  return { accessToken, refreshToken };
};

export const register = async (input: RegisterInput) => {
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email));
  if (existingUser) {
    throw new AppError(409, "USER_ALREADY_EXISTS", "User already exists");
  }
  const passwordHash = await bcrypt.hash(input.password, 10);

  const [newUser] = await db
    .insert(users)
    .values({
      email: input.email,
      passwordHash,
      name: input.name,
    })
    .returning();

  return generateTokens({
    userId: newUser.id,
    email: input.email,
  });
};

export const login = async (input: LoginInput) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email));

  const isPasswordValid = user
    ? await bcrypt.compare(input.password, user.passwordHash)
    : await bcrypt.compare(input.password, DUMMY_HASH);

  if (!user || !isPasswordValid) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  return generateTokens({
    userId: user.id,
    email: user.email,
  });
};

export const refreshTokens = async (token: string) => {
  const payload = verifyRefreshToken(token);

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, payload.userId));

  if (!user) {
    throw new AppError(401, "INVALID_REFRESH_TOKEN", "User no longer exists");
  }

  return generateTokens({
    userId: user.id,
    email: user.email,
  });
};

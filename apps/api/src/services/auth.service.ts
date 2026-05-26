import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema/index.js";
import type { RegisterInput, LoginInput } from "@element-flow/shared";
import { AppError } from "../lib/errors.js";
import {
  JWT_REFRESH_SECRET,
  verifyToken,
  generateTokens,
} from "../config/jwt.js";

const DUMMY_HASH = "$2a$10$invalidhashinvalidhashinvalid.";

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
  const payload = verifyToken(token, JWT_REFRESH_SECRET);

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

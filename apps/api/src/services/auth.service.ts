import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema/index.js";
import type { RegisterInput, LoginInput } from "@element-flow/shared";

// TODO 1: Define a TokenPayload type for what gets encoded in the JWT
// It should contain userId and email
type TokenPayload = {
  userId: string;
  email: string;
};

// TODO 2: Implement generateTokens(payload: TokenPayload)
// - Sign an access token using JWT_SECRET, expires in JWT_EXPIRES_IN
// - Sign a refresh token using JWT_REFRESH_SECRET, expires in JWT_REFRESH_EXPIRES_IN
// - Return { accessToken, refreshToken }

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ||
  "15m") as `${number}${"s" | "m" | "h" | "d" | "w" | "y"}`;
const JWT_REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN ||
  "7d") as `${number}${"s" | "m" | "h" | "d" | "w" | "y"}`;

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
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email));
  if (existingUser.length > 0) {
    throw new Error("User already exists");
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

// TODO 4: Implement login(input: LoginInput)
// - Find user by input.email in the DB
// - If not found OR password doesn't match, throw a generic 401 error
//   (do NOT reveal whether email or password was wrong)
// - Generate and return tokens using generateTokens()

// TODO 5: Implement refreshTokens(token: string)
// - Verify the refresh token using JWT_REFRESH_SECRET
// - Extract userId from the payload
// - Find the user in the DB to confirm they still exist
// - If invalid or user not found, throw 401
// - Generate and return new tokens using generateTokens()

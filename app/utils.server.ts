import { User } from "@prisma/client";
import { Session } from "remix";
import { prisma } from "./db";
import crypto from "crypto";

function genSalt() {
  return crypto.randomBytes(16).toString("hex");
}

function hash(password: string, salt: string) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
}

function compare(salt?: string, hash?: string, password?: string) {
  if (!hash || !password || !salt) return false;
  return (
    crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex") ===
    hash
  );
}

export async function handleLogin(variables: {
  email: string;
  password: string;
}) {
  const user = await prisma.user.findUnique({
    where: {
      email: variables.email,
    },
  });

  if (!user) {
    throw new Error("No user with those credentials");
  }

  if (!compare(user?.salt, user?.password, variables.password)) {
    throw new Error("No user with those credentials");
  }

  const userCopy = {
    email: user?.email,
    id: user?.id,
    alias: user?.alias,
  };

  return userCopy;
}

type RegisterUser = Omit<Omit<Omit<User, "salt">, "id">, "createdAt">;

export async function handleRegister(variables: RegisterUser) {
  const salt = genSalt();
  try {
    const newUser = await prisma.user.create({
      data: {
        ...variables,
        password: hash(variables.password, salt),
        salt,
      },
    });

    if (!newUser) {
      throw new Error("No user was created.");
    }

    return await handleLogin({
      email: newUser.email,
      password: newUser.password,
    });
  } catch (err) {
    throw new Error((err as Error).message);
  }
}

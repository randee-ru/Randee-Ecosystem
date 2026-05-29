import { db } from './db'

export type User = {
  id: string
  email: string
  name: string
  passwordHash: string
  createdAt: Date
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return db.user.findUnique({ where: { email: email.toLowerCase() } })
}

export async function findUserById(id: string): Promise<User | null> {
  return db.user.findUnique({ where: { id } })
}

export async function createUser(data: {
  email: string
  name: string
  passwordHash: string
}): Promise<User> {
  return db.user.create({
    data: {
      email: data.email.trim().toLowerCase(),
      name: data.name.trim(),
      passwordHash: data.passwordHash,
    },
  })
}

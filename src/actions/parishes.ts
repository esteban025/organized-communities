import { defineAction } from "astro:actions";
import { z } from "astro:schema";
import { createParishInDB, deleteParishFromDB, getParishByIdFromDB, getParishesFromDB, updateParishInDB } from "@/services/parishes";

export const getParishById = defineAction({
  input: z.object({
    id: z.coerce.number().int(),
  }),
  async handler(input) {
    const res = await getParishByIdFromDB(input.id)
    return {
      success: res.success,
      message: res.message,
      data: res.data,
    }
  }
})

export const getParishes = defineAction({
  async handler() {
    const res = await getParishesFromDB()
    return {
      success: res.success,
      message: res.message,
      data: res.data,
    }
  }
})

export const postParish = defineAction({
  input: z.object({
    id: z.coerce.number().int().optional(),
    name: z.string().min(3).max(100),
    tag: z.string().min(2).max(20),
    aka: z.string().min(3).max(100)
  }),
  async handler(input) {
    // si el input contiene id, actualizamod
    if (input.id) {
      const res = await updateParishInDB({ id: input.id, ...input })
      return {
        success: res.success,
        message: res.message,
        data: res.data,
      }
    }

    // si el input no contiene id, creamos
    const res = await createParishInDB(input)
    return {
      success: res.success,
      message: res.message,
      data: res.data,
    }
  }
})

export const deleteParish = defineAction({
  input: z.object({
    id: z.coerce.number().int(),
  }),
  async handler(input) {
    const res = await deleteParishFromDB(input.id)
    return {
      success: res.success,
      message: res.message,
    }
  }
})
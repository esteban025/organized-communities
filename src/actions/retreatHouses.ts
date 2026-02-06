import { createRetreatHouseInDB, deleteRetreatHouseInDB, getRetreatHousesFromDB, updateRetreatHouseInDB } from "@/services/retreatHouses"
import { defineAction } from "astro:actions"
import { z } from "astro:schema"

export const getRetreatHouses = defineAction({
  async handler() {
    const res = await getRetreatHousesFromDB()
    return {
      success: res.success,
      message: res.message,
      data: res.data,
    }
  }
})

export const postRetreatHouses = defineAction({
  input: z.object({
    id: z.coerce.number().int().optional(),
    name: z.string().min(3).max(100),
    address: z.string().min(5).max(200),
    max_capacity: z.coerce.number().int().min(1),
    description: z.string().max(500).nullable(),
  }),
  async handler(input) {
    if (input.id) {
      const id = input.id
      const res = await updateRetreatHouseInDB({ id, ...input })
      return {
        success: res.success,
        message: res.message,
        data: res.data,
      }
    }

    // creamos
    const res = await createRetreatHouseInDB(input)
    return {
      success: res.success,
      message: res.message,
      data: res.data,
    }

  }
})

export const deleteRetreatHouse = defineAction({
  input: z.object({
    id: z.coerce.number().int(),
  }),
  async handler(input) {
    const res = await deleteRetreatHouseInDB(input.id)
    return {
      success: res.success,
      message: res.message,
    }
  }
})
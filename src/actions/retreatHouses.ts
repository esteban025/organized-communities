import { createRetreatHouseInDB, getRetreatHousesFromDB } from "@/services/retreatHouses"
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
      // actualizamos
      return {
        success: false,
        message: "Actualizar casa de retiro no implementado",
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
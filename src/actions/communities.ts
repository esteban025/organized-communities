import { createCommunityInDB, deleteCommunityInDB, getCommunitiesByParishIdFromDB, updateCommunityInDB, getComunityByIdFromDB } from "@/services/communities";
import { defineAction } from "astro:actions";
import { z } from "astro:schema";

export const getCommunityById = defineAction({
  input: z.object({
    id: z.coerce.number().int(),
  }),
  async handler(input) {
    const res = await getComunityByIdFromDB(input.id);
    return {
      success: res.success,
      message: res.message,
      data: res.data,
    }
  }
})
export const getCommunities = defineAction({
  input: z.object({
    parishId: z.coerce.number().int(),
  }),
  async handler({ parishId }) {
    const res = await getCommunitiesByParishIdFromDB(parishId);
    return {
      success: res.success,
      message: res.message,
      data: res.data,
    }
  }
})

export const postCommunity = defineAction({
  input: z.object({
    id: z.coerce.number().int().optional(),
    number_community: z.number().min(1),
    parish_id: z.number().int(),
    level_paso: z.string().min(1),
  }),
  async handler(input) {
    // si hay id actulizamos
    if (input.id) {
      const res = await updateCommunityInDB({
        id: input.id,
        number_community: input.number_community,
        parish_id: input.parish_id,
        level_paso: input.level_paso,
      })
      return {
        success: res.success,
        message: res.message,
        data: res.data,
      }
    }

    // si no hay id creamos
    const res = await createCommunityInDB({
      number_community: input.number_community,
      parish_id: input.parish_id,
      level_paso: input.level_paso,
    })
    return {
      success: res.success,
      message: res.message,
      data: res.data,
    }
  }
})

export const deleteCommunity = defineAction({
  input: z.object({
    id: z.coerce.number().int(),
  }),
  async handler({ id }) {
    const res = await deleteCommunityInDB(id);
    return {
      success: res.success,
      message: res.message,
      data: res.data,
    }
  }
})
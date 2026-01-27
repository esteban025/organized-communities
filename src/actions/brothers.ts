import {
  getBrothersByCommunityIdFromDB, getGroupLeadersByCommunityIdFromDB, getGroupCatechistsByCommunityIdFromDB, example, createBrotherInDB
} from "@/services/brothers";
import { defineAction } from "astro:actions";
import { z } from "astro:schema";

export const getBrothers = defineAction({
  input: z.object({
    communityId: z.number().int(),
  }),
  async handler(input) {
    const res = await getBrothersByCommunityIdFromDB(input.communityId);

    return {
      success: res.success,
      message: res.message,
      data: res.data,
    }
  }
});

export const getGroupLeaders = defineAction({
  input: z.object({
    communityId: z.number().int(),
  }),
  async handler(input) {
    const res = await getGroupLeadersByCommunityIdFromDB({ community_id: input.communityId });

    return {
      success: res.success,
      message: res.message,
      data: res.data
    }
  }
});

export const getGroupCatechists = defineAction({
  input: z.object({
    communityId: z.number().int(),
  }),
  async handler(input) {
    const res = await getGroupCatechistsByCommunityIdFromDB({ community_id: input.communityId });
    return {
      success: res.success,
      message: res.message,
      data: res.data
    }
  }
});

// ejemplo de recibir a matrimonios en una sola fila
export const getExample = defineAction({
  input: z.object({
    communityId: z.number().int(),
  }),
  async handler(input) {
    const res = await example({ community_id: input.communityId });
    return {
      success: res.success,
      message: res.message,
      data: res.data,
    }
  }
});

export const postBrother = defineAction({
  input: z.object({
    // id: z.coerce.number().int().optional(),
    names: z.string().min(3).max(100),
    civil_status: z.enum(["matrimonio", "soltero", "soltera"]),
    community_id: z.coerce.number().int(),
    phone: z.string().max(15).nullable(),
    // spouse_id: z.coerce.number().int().optional(),
    roles: z.array(z.string()),
  }),
  async handler(input) {
    // si es matrimonio aplicamos lógica especial

    // si es soltero/a, creamos directamente
    const res = await createBrotherInDB({
      names: input.names,
      civil_status: input.civil_status,
      community_id: input.community_id,
      phone: input.phone,
      roles: input.roles,
    });
    return {
      success: res.success,
      message: res.message,
      data: res.data,
    }
  }
})
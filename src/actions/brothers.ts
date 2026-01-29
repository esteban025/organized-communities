import {
  getBrohterByIdFromDB,
  getBrothersByCommunityIdFromDB,
  getGroupLeadersByCommunityIdFromDB,
  createSingleBrotherInDB,
  createMarriageInDB,
  deleteBrotherInDB,
  updateSingleBrotherInDB,
  updateMarriageInDB,
} from "@/services/brothers";

import { defineAction } from "astro:actions";
import { z } from "astro:schema";
export const getBrotherById = defineAction({
  input: z.object({
    id: z.coerce.number().int(),
  }),
  async handler(input) {
    const res = await getBrohterByIdFromDB(input.id);
    console.log(res.data)
    return {
      success: res.success,
      message: res.message,
      data: res.data,
    };
  }
})

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
    };
  },
});

export const getGroupLeaders = defineAction({
  input: z.object({
    communityId: z.number().int(),
  }),
  async handler(input) {
    const res = await getGroupLeadersByCommunityIdFromDB({
      community_id: input.communityId,
    });

    return {
      success: res.success,
      message: res.message,
      data: res.data,
    };
  },
});

export const postBrother = defineAction({
  input: z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("single"),
      id: z.number().int().positive().optional(),
      names: z.string().min(1),
      civil_status: z.union([z.literal("soltero"), z.literal("soltera")]),
      community_id: z.number().int().positive(),
      phone: z.string().nullable(),
      roles: z.array(z.string()),
      catechist_communities: z
        .array(z.number().int().positive())
        .optional(),
    }),
    z.object({
      kind: z.literal("marriage"),
      id: z.number().int().positive().optional(),
      husband: z.object({
        names: z.string().min(1),
        phone: z.string().nullable(),
      }),
      wife: z.object({
        names: z.string().min(1),
        phone: z.string().nullable(),
      }),
      community_id: z.number().int().positive(),
      roles: z.array(z.string()),
      catechist_communities: z
        .array(z.number().int().positive())
        .optional(),
    }),
  ]),
  async handler(input) {
    if (input.kind === "single") {
      if (input.id) {
        // Actualizar persona existente (soltero/soltera)
        const result = await updateSingleBrotherInDB({
          id: input.id,
          names: input.names,
          civil_status: input.civil_status,
          community_id: input.community_id,
          phone: input.phone,
          roles: input.roles,
          catechist_communities: input.catechist_communities,
        });
        return result;
      } else {
        // Crear nueva persona (soltero/soltera)
        const result = await createSingleBrotherInDB({
          names: input.names,
          civil_status: input.civil_status,
          community_id: input.community_id,
          phone: input.phone,
          roles: input.roles,
          catechist_communities: input.catechist_communities,
        });
        return result;
      }
    }

    // Crear matrimonio
    if (input.id) {
      const result = await updateMarriageInDB({
        id: input.id,
        husband: input.husband,
        wife: input.wife,
        community_id: input.community_id,
        roles: input.roles,
        catechist_communities: input.catechist_communities,
      });
      return result;
    } else {
      const result = await createMarriageInDB({
        husband: input.husband,
        wife: input.wife,
        community_id: input.community_id,
        roles: input.roles,
        catechist_communities: input.catechist_communities,
      });

      return result;
    }
  },
});
export const deleteBrother = defineAction({
  input: z.object({
    // array de numeros
    ids: z.array(z.coerce.number().int()),
  }),
  async handler({ ids }) {
    const res = await deleteBrotherInDB(ids);
    return {
      success: res.success,
      message: res.message,
      data: res.data,
    };
  },
});

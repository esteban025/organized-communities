import { defineAction } from "astro:actions";
import { z } from "astro:schema";
import {
  getRetreatsFromDB,
  createRetreatInDB,
  getRetreatByIdFromDB,
  getBrotherOfRetreatByIdFromDB,
  confirmRetreatAttendanceInDB,
  getRetreatConfirmedAttendeesFromDB,
  updateRetreatAttendanceGroupInDB,
  deleteRetreatAttendanceGroupInDB,
  updateRetreatAttendeesStatusInDB,
  updateRetreatStatusInDB,
} from "@/services/retreats"

export const getRetreats = defineAction({
  async handler() {
    const res = await getRetreatsFromDB()
    return {
      success: res.success,
      message: res.message,
      data: res.data
    }
  }
})

export const getRetreatById = defineAction({
  input: z.object({
    id: z.coerce.number()
  }),
  async handler(input) {
    const res = await getRetreatByIdFromDB({ id: input.id })
    return {
      success: res.success,
      message: res.message,
      data: res.data
    }
  }
})

export const getBrotherOfRetreatById = defineAction({
  input: z.object({
    id: z.coerce.number()
  }),
  async handler(input) {
    const res = await getBrotherOfRetreatByIdFromDB({ id: input.id })
    return {
      success: res.success,
      message: res.message,
      data: res.data
    }
  }
})

export const confirmRetreatAttendance = defineAction({
  input: z.object({
    retreat_id: z.coerce.number(),
    person_ids: z.array(z.number()),
    observation: z.string().optional(),
    retreat_house_id: z.coerce.number().nullable()
  }),
  async handler(input) {
    const res = await confirmRetreatAttendanceInDB(input)
    return {
      success: res.success,
      message: res.message,
    }
  }
})

export const getRetreatConfirmedAttendees = defineAction({
  input: z.object({
    retreat_id: z.coerce.number()
  }),
  async handler(input) {
    const res = await getRetreatConfirmedAttendeesFromDB(input.retreat_id)
    return {
      success: res.success,
      message: res.message,
      data: res.data
    }
  }
})

export const updateRetreatAttendanceGroup = defineAction({
  input: z.object({
    retreat_id: z.coerce.number(),
    person_ids: z.array(z.number()),
    observation: z.string().optional(),
    retreat_house_id: z.coerce.number().nullable(),
  }),
  async handler(input) {
    const res = await updateRetreatAttendanceGroupInDB(input);
    return {
      success: res.success,
      message: res.message,
    };
  },
})

export const deleteRetreatAttendanceGroup = defineAction({
  input: z.object({
    retreat_id: z.coerce.number(),
    person_ids: z.array(z.number()),
  }),
  async handler(input) {
    const res = await deleteRetreatAttendanceGroupInDB(input);
    return {
      success: res.success,
      message: res.message,
    };
  },
})

export const updateRetreatAttendeesStatus = defineAction({
  input: z.object({
    retreat_id: z.coerce.number(),
    attended_person_ids: z.array(z.number()),
    not_attended_person_ids: z.array(z.number()),
  }),
  async handler(input) {
    const res = await updateRetreatAttendeesStatusInDB(input);
    return {
      success: res.success,
      message: res.message,
    };
  },
})

export const updateRetreatStatus = defineAction({
  input: z.object({
    retreat_id: z.coerce.number(),
    status: z.enum(["planificacion", "en_curso", "finalizada"]),
  }),
  async handler(input) {
    const res = await updateRetreatStatusInDB(input);
    return {
      success: res.success,
      message: res.message,
    };
  },
})

export const postRetreat = defineAction({
  input: z.object({
    id: z.coerce.number().optional(),
    title: z.string().min(1).max(200),
    description: z.string().nullable(),
    start_date: z.string().refine(date => !isNaN(Date.parse(date)), { message: "Invalid date format" }),
    end_date: z.string().refine(date => !isNaN(Date.parse(date)), {
      message: "Invalid date format"
    }),
    cost_per_person: z.number().nonnegative(),
    communities_ids: z.array(z.number()),
    is_leaders_only: z.boolean().default(false)
  }),
  async handler(input) {
    if (input.id) {
      // Actualizamos
    }

    // creamos
    const res = await createRetreatInDB(input)
    return {
      success: res.success,
      message: res.message,
    }

  }
})
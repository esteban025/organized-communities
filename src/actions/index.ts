import {
  getParishes,
  postParish,
  deleteParish,
  getParishById
} from "./parishes"

import {
  deleteCommunity,
  getCommunities,
  postCommunity,
  getCommunityById,
  mergeCommunities
} from "./communities"

import {
  getBrotherById,
  getBrothers,
  getGroupLeaders,
  postBrother,
  deleteBrother
} from "./brothers"

import { getRetreatHouses, postRetreatHouses, deleteRetreatHouse } from "./retreatHouses"

import {
  getRetreats,
  postRetreat,
  getRetreatById,
  getBrotherOfRetreatById,
  getRetreatConfirmedAttendees,
  confirmRetreatAttendance,
  updateRetreatAttendanceGroup,
  deleteRetreatAttendanceGroup,
} from "./retreats"

export const server = {
  getParishById,
  getParishes,
  postParish,
  deleteParish,
  getCommunityById,
  getCommunities,
  postCommunity,
  deleteCommunity,
  mergeCommunities,
  getBrotherById,
  getBrothers,
  getGroupLeaders,
  postBrother,
  deleteBrother,
  getRetreatHouses,
  postRetreatHouses,
  deleteRetreatHouse,
  getRetreats,
  getRetreatById,
  getBrotherOfRetreatById,
  getRetreatConfirmedAttendees,
  confirmRetreatAttendance,
  updateRetreatAttendanceGroup,
  deleteRetreatAttendanceGroup,
  postRetreat
}
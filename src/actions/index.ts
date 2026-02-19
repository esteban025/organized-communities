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
  deleteBrother,
  searchBrothers
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
  updateRetreatAttendeesStatus,
  updateRetreatStatus,
  saveRetreatCommunityPayments,
  getRetreatsHistory,
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
  searchBrothers,
  getRetreatHouses,
  postRetreatHouses,
  deleteRetreatHouse,
  getRetreats,
  getRetreatById,
  getBrotherOfRetreatById,
  getRetreatConfirmedAttendees,
  confirmRetreatAttendance,
  updateRetreatAttendanceGroup,
  updateRetreatAttendeesStatus,
  deleteRetreatAttendanceGroup,
  postRetreat,
  updateRetreatStatus,
  saveRetreatCommunityPayments,
  getRetreatsHistory,
}
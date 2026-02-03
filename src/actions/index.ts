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

import { getRetreatHouses, postRetreatHouses } from "./retreatHouses"

import { getRetreats, postRetreat } from "./retreats"

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
  getRetreats,
  postRetreat
}
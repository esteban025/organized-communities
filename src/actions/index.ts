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
}
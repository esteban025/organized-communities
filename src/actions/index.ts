import { getParishes, postParish, deleteParish, getParishById } from "./parishes"
import { deleteCommunity, getCommunities, postCommunity } from "./communities"
import { getBrothers, getGroupLeaders, getGroupCatechists, getExample, postBrother } from "./brothers"

export const server = {
  getParishById,
  getParishes,
  postParish,
  deleteParish,
  getCommunities,
  postCommunity,
  deleteCommunity,
  getBrothers,
  getGroupLeaders,
  getGroupCatechists,
  getExample,
  postBrother
}
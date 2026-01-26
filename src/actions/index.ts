import { getParishes, postParish, deleteParish, getParishById } from "./parishes"
import { deleteCommunity, getCommunities, postCommunity } from "./communities"

export const server = {
  getParishById,
  getParishes,
  postParish,
  deleteParish,
  getCommunities,
  postCommunity,
  deleteCommunity
}
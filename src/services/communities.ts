import { db } from "@/lib/db"
import type { Community, CommunityWithBrotherCount } from "@/types/communities"

export const getCommunitiesByParishIdFromDB = async (parishId: number) => {
  const query = `
    SELECT 
      c.id,
      c.number_community,
      c.level_paso,
      COUNT(DISTINCT b.id) as count_brothers,
      GROUP_CONCAT(
        DISTINCT CASE 
          WHEN br_roles.role = 'responsable' THEN b_resp.names 
        END 
        ORDER BY b_resp.id 
        SEPARATOR ', '
      ) as responsables
    FROM communities c
    LEFT JOIN brothers b ON b.community_id = c.id
    LEFT JOIN brother_roles br_roles ON br_roles.community_id = c.id AND br_roles.role = 'responsable'
    LEFT JOIN brothers b_resp ON b_resp.id = br_roles.brother_id
    WHERE c.parish_id = ?
    GROUP BY c.id, c.number_community, c.level_paso
    ORDER BY c.number_community;
  `
  const [rows] = await db.query(query, [parishId])
  const data = rows as CommunityWithBrotherCount[]

  const formattedData = data.map((comm) => ({
    ...comm,
    responsables: comm.responsables ? comm.responsables.split(", ")[0] : null
  }))

  return {
    success: true,
    message: "Comunidades obtenidas correctamente",
    data: formattedData
  }
}

// crear una comunidad con id de parroquia
export const createCommunityInDB = async (data: Omit<Community, "id">) => {
  // verificar que numero de comunidad no se repita
  const checkQuery = `
    SELECT id FROM communities WHERE number_community = ? AND parish_id = ?;
  `
  const [checkRows] = await db.query(checkQuery, [data.number_community, data.parish_id]);
  const existing = checkRows as any[];
  if (existing.length > 0) {
    return {
      success: false,
      message: "El número de comunidad ya existe en esta parroquia",
      data: null
    }
  }

  // creamos
  const { number_community, parish_id, level_paso } = data;
  const query = `
    INSERT INTO communities (number_community, parish_id, level_paso) VALUES (?, ?, ?);
  `
  const [result] = await db.query(query, [number_community, parish_id, level_paso]);
  return {
    success: true,
    message: "Comunidad creada correctamente",
    data: {
      id: (result as any).insertId,
      ...data
    }
  }
}

// actualizamos una comunidad por id
export const updateCommunityInDB = async (data: Community) => {

  // verificar que numero de comunidad no se repita
  const checkQuery = `
    SELECT id FROM communities WHERE number_community = ? AND parish_id = ? AND id != ?;
  `
  const [checkRows] = await db.query(checkQuery, [data.number_community, data.parish_id, data.id]);
  const existing = checkRows as any[];
  if (existing.length > 0) {
    return {
      success: false,
      message: "El número de comunidad ya existe en esta parroquia",
      data: null
    }
  }

  // actualizamos
  const { id, number_community, parish_id, level_paso } = data;
  const query = `
    UPDATE communities SET number_community = ?, parish_id = ?, level_paso = ? WHERE id = ?;
  `
  const [result] = await db.query(query, [number_community, parish_id, level_paso, id]);
  return {
    success: true,
    message: "Comunidad actualizada correctamente",
    data
  }
}

// eliminar una comunidad por id
export const deleteCommunityInDB = async (id: number) => {
  const query = `
    DELETE FROM communities WHERE id = ?;
  `
  const [result] = await db.query(query, [id]);
  return {
    success: true,
    message: "Comunidad eliminada correctamente",
    data: { id }
  }
}
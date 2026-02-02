import { db } from "@/lib/db"
import type { Community, CommunityWithBrotherCount } from "@/types/communities"

export const getComunityByIdFromDB = async (id: number) => {
  const query = `
    SELECT id, number_community, parish_id, level_paso
    FROM communities
    WHERE id = ?;
  `
  const [rows] = await db.query(query, [id])
  const data = rows as Community[]
  return {
    success: true,
    message: "Comunidad obtenida correctamente",
    data: data[0]
  }
}
export const getCommunitiesByParishIdFromDB = async (parishId: number) => {
  // verificamos que id exista
  const checkQuery = `SELECT id FROM parishes WHERE id = ?;`
  const [checkRows] = await db.query(checkQuery, [parishId])
  const existing = checkRows as any[]
  if (existing.length === 0) {
    return {
      success: false,
      message: "No existe una parroquia con el ID proporcionado",
      data: []
    }
  }
  const query = `
    SELECT 
      c.id,
      c.number_community,
      c.level_paso,
      COUNT(DISTINCT p.id) as count_persons,
      COUNT(DISTINCT m.id) as count_marriages,
      COUNT(DISTINCT CASE 
        WHEN m.id IS NULL THEN p.id 
      END) as count_singles,
      (
        SELECT p_resp.names
        FROM person_roles pr_resp
        INNER JOIN persons p_resp ON pr_resp.person_id = p_resp.id
        WHERE pr_resp.community_id = c.id 
          AND pr_resp.role = 'responsable'
        ORDER BY p_resp.id ASC
        LIMIT 1
      ) as responsable
    FROM communities c
    LEFT JOIN persons p ON p.community_id = c.id
    LEFT JOIN marriages m ON (p.id = m.person1_id OR p.id = m.person2_id) AND m.community_id = c.id
    WHERE c.parish_id = ?
    GROUP BY c.id, c.number_community, c.level_paso
    ORDER BY c.number_community;
  `
  const [rows] = await db.query(query, [parishId])
  const data = rows as CommunityWithBrotherCount[]

  return {
    success: true,
    message: "Comunidades obtenidas correctamente",
    data
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

export const mergeCommunitiesInDB = async (parishId: number, communityIds: number[]) => {

  const [keepCommunityId, deleteCommunityId] = communityIds;

  try {
    // 1. Verificar que ambas comunidades pertenezcan a la misma parroquia
    const [communitiesFromDB] = await db.query(
      `SELECT id FROM communities 
       WHERE id IN (?, ?) AND parish_id = ?`,
      [keepCommunityId, deleteCommunityId, parishId]
    );
    const communities = communitiesFromDB as any[];

    if (communities.length !== 2) {
      return {
        success: false,
        message: "Las comunidades no pertenecen a la misma parroquia o no existen",
        data: null,
      };
    }

    // 2. Mover todas las personas de la comunidad a eliminar a la comunidad que permanece
    await db.execute(
      `UPDATE persons 
       SET community_id = ? 
       WHERE community_id = ?`,
      [keepCommunityId, deleteCommunityId]
    );

    // 3. Mover todos los matrimonios a la comunidad que permanece
    await db.execute(
      `UPDATE marriages 
       SET community_id = ? 
       WHERE community_id = ?`,
      [keepCommunityId, deleteCommunityId]
    );

    // 4. Eliminar TODOS los roles de la comunidad que se elimina, EXCEPTO catequistas
    await db.execute(
      `DELETE FROM person_roles 
       WHERE community_id = ? AND role != 'catequista'`,
      [deleteCommunityId]
    );

    // 5. Mover los roles de catequista a la comunidad que permanece
    await db.execute(
      `UPDATE person_roles 
       SET community_id = ? 
       WHERE community_id = ? AND role = 'catequista'`,
      [keepCommunityId, deleteCommunityId]
    );

    // 6. Eliminar la comunidad
    await db.execute(
      `DELETE FROM communities WHERE id = ?`,
      [deleteCommunityId]
    );

    // 7. Obtener estadísticas de la comunidad fusionada
    const [statsFromDB] = await db.query(
      `SELECT 
        COUNT(DISTINCT p.id) as total_personas,
        COUNT(DISTINCT m.id) as total_matrimonios,
        COUNT(DISTINCT CASE WHEN m.id IS NULL THEN p.id END) as total_solteros
       FROM persons p
       LEFT JOIN marriages m ON (p.id = m.person1_id OR p.id = m.person2_id) AND m.community_id = p.community_id
       WHERE p.community_id = ?`,
      [keepCommunityId]
    );
    const stats = statsFromDB as any[];

    return {
      success: true,
      message: `Comunidades fusionadas exitosamente. ${stats[0].total_personas} personas ahora pertenecen a la comunidad ${keepCommunityId}`,
      data: {
        community_id: keepCommunityId,
        total_personas: stats[0].total_personas,
        total_matrimonios: stats[0].total_matrimonios,
        total_solteros: stats[0].total_solteros,
      },
    };

  } catch (error: any) {
    console.error("Error merging communities:", error);

    if (error.code === 'ER_DUP_ENTRY') {
      return {
        success: false,
        message: "Error: Ya existen personas con los mismos nombres en la comunidad destino",
        data: null,
      };
    }

    return {
      success: false,
      message: "Error al fusionar comunidades",
      data: null,
    };
  }
}
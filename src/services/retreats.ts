import { db } from "@/lib/db";
import type { CreateRetreatInput, RetreatsGet } from "@/types/retreats";
import type { BrotherInvited } from "@/types/brothers";

export const getRetreatsFromDB = async () => {
  const query = `
    SELECT 
      r.id,
      r.title,
      r.description,
      r.start_date,
      r.end_date,
      r.cost_per_person,
      r.status,
      r.is_leaders_only,
      r.created_at,
      r.updated_at,
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', c.id,
            'number_community', c.number_community,
            'responsable', COALESCE(
              (
                SELECT p.names
                FROM person_roles pr
                INNER JOIN persons p ON pr.person_id = p.id
                WHERE pr.community_id = c.id 
                  AND pr.role = 'responsable'
                ORDER BY p.id ASC
                LIMIT 1
              ),
              NULL
            )
          )
        )
        FROM retreat_communities rc
        INNER JOIN communities c ON rc.community_id = c.id
        WHERE rc.retreat_id = r.id
        ORDER BY c.number_community
      ) as communities,
      (
        SELECT COUNT(*)
        FROM retreat_communities rc
        WHERE rc.retreat_id = r.id
      ) as total_communities
    FROM retreats r
    ORDER BY r.start_date DESC;
  `;
  const [rows] = await db.query(query);
  const data = rows as RetreatsGet[];
  return {
    success: true,
    message: "Convivencias obtenidas con éxito",
    data
  };
}

export const getRetreatByIdFromDB = async ({ id }: { id: number }) => {
  const query = `
    SELECT 
      p.id,
      p.names,
      p.civil_status,
      p.community_id,
      c.number_community,
      CASE 
        WHEN m.id IS NOT NULL THEN 'matrimonio'
        ELSE p.civil_status
      END as tipo,
      CASE 
        WHEN ra.id IS NOT NULL THEN TRUE
        ELSE FALSE
      END as is_confirmed
    FROM persons p
    INNER JOIN retreat_communities rc ON p.community_id = rc.community_id
    INNER JOIN communities c ON p.community_id = c.id
    LEFT JOIN marriages m ON (p.id = m.person1_id OR p.id = m.person2_id) AND m.community_id = p.community_id
    LEFT JOIN retreat_attendees ra ON ra.retreat_id = rc.retreat_id AND ra.person_id = p.id
    WHERE rc.retreat_id = ?
      AND ra.id IS NULL -- Solo los que NO están confirmados
      AND (m.id IS NULL OR p.id = m.person1_id) -- Si es matrimonio, solo mostrar una vez
    ORDER BY c.number_community, p.names;
  `
  const [rows] = await db.query(query, [id]);
  const data = rows as RetreatsGet[];
  return {
    success: true,
    message: "Convivencia obtenida con éxito",
    data
  };
}

export const getBrotherOfRetreatByIdFromDB = async ({ id }: { id: number }) => {
  const query = `
    SELECT DISTINCT
      p.id,
      p.names,
      p.civil_status,
      p.community_id,
      c.number_community
    FROM persons p
    INNER JOIN retreat_communities rc ON p.community_id = rc.community_id
    INNER JOIN communities c ON p.community_id = c.id
    WHERE rc.retreat_id = ?
    ORDER BY p.community_id, p.names;
  `
  const [rows] = await db.query(query, [id]);
  const data = rows as BrotherInvited[];
  console.log(data);
  return {
    success: true,
    message: "Hermanos de la convivencia obtenidos con éxito",
    data
  };
}

export const createRetreatInDB = async (retreatData: CreateRetreatInput) => {
  const { title, description, start_date, end_date, cost_per_person, is_leaders_only, communities_ids } = retreatData
  const queryInsert = `
    INSERT INTO retreats (title, description, start_date, end_date, cost_per_person, is_leaders_only)
    VALUES (?, ?, ?, ?, ?, ?)
  `
  const [rows] = await db.query(queryInsert, [title, description, start_date, end_date, cost_per_person, is_leaders_only])
  const insertId = (rows as any).insertId

  // asociar comunidades
  const communitiesValues = communities_ids.map(id => [insertId, id])
  const placeholders = communitiesValues.map(() => '(?, ?)').join(', ')
  const queryAssociateCommunities = `
    INSERT INTO retreat_communities (retreat_id, community_id)
    VALUES ${placeholders}
  `
  const flattenedValues = communitiesValues.flat()
  await db.query(queryAssociateCommunities, flattenedValues)

  return {
    success: true,
    message: "Convivencia creada con éxito",
    data: insertId
  }
}
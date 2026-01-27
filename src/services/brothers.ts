import { db } from "@/lib/db";
import type { BrotherwithRoles } from "@/types/brothers";

export const getBrothersByCommunityIdFromDB = async (communityId: number) => {
  const query = `
    SELECT
      b.id,
      b.names,
      b.civil_status,
      b.community_id,
      b.phone,
      b.spouse_id,
      COALESCE(GROUP_CONCAT(DISTINCT br.role ORDER BY br.role SEPARATOR ','), '') AS roles
    FROM brothers b
    LEFT JOIN brother_roles br
      ON br.brother_id = b.id AND br.community_id = b.community_id
    WHERE b.community_id = ?
    GROUP BY
      b.id,
      b.names,
      b.civil_status,
      b.community_id,
      b.phone,
      b.spouse_id
  `
  const [rows] = await db.query(query, [communityId]);
  const brothers = rows as BrotherwithRoles[]

  return {
    success: true,
    message: "Hermanos recuperados correctamente",
    data: brothers
  }
}

export const getGroupLeadersByCommunityIdFromDB = async ({ community_id }: { community_id: number }) => {
  const query = `
    SELECT DISTINCT
      b.id,
      b.names,
      b.civil_status,
      b.phone,
      b.spouse_id,
      GROUP_CONCAT(br.role ORDER BY br.role SEPARATOR ', ') as roles
    FROM brothers b
    INNER JOIN brother_roles br ON b.id = br.brother_id
    WHERE b.community_id = ? -- ID de la comunidad
      AND br.community_id = ? -- Mismo ID (roles en su propia comunidad)
      AND br.role != 'catequista' -- Excluir catequistas
    GROUP BY b.id, b.names, b.civil_status, b.phone, b.spouse_id
    ORDER BY b.names;
  `
  const [rows] = await db.query(query, [community_id, community_id]);
  const leaders = rows as BrotherwithRoles[]
  return {
    success: true,
    message: "Líderes de grupo recuperados correctamente",
    data: leaders
  }
}

export const getGroupCatechistsByCommunityIdFromDB = async ({ community_id }: { community_id: number }) => {
  const query = `
    SELECT DISTINCT
      b.id,
      b.names,
      b.civil_status,
      b.phone,
      b.spouse_id,
      b.community_id as own_community_id,
      'catequista' as role
    FROM brothers b
    INNER JOIN brother_roles br ON b.id = br.brother_id
    WHERE br.community_id = ? -- ID de la comunidad que estamos consultando
      AND br.role = 'catequista'
      AND b.community_id != ? -- NO pertenece a esta comunidad
    ORDER BY b.names;
  `
  const [rows] = await db.query(query, [community_id, community_id]);
  const catechists = rows as BrotherwithRoles[]
  return {
    success: true,
    message: "Catequistas recuperados correctamente",
    data: catechists
  }
}

export const example = async ({ community_id }: { community_id: number }) => {
  const query = `
    SELECT 
      CASE 
        WHEN b.civil_status = 'matrimonio' AND b.spouse_id IS NOT NULL THEN
          LEAST(b.id, b.spouse_id) -- Usa el ID más bajo del matrimonio como identificador único
        ELSE b.id
      END as group_id,
      
      CASE 
        WHEN b.civil_status = 'matrimonio' AND b.spouse_id IS NOT NULL THEN
          CONCAT(
            b.names, 
            ' y ', 
            (SELECT names FROM brothers WHERE id = b.spouse_id)
          )
        ELSE b.names
      END as names,
      
      b.civil_status,
      b.phone,
      
      CASE 
        WHEN b.civil_status = 'matrimonio' THEN 'matrimonio'
        WHEN b.civil_status = 'soltera' THEN 'soltera'
        WHEN b.civil_status = 'soltero' THEN 'soltero'
      END as status_type

    FROM brothers b
    WHERE b.community_id = ?
      AND (
        b.civil_status != 'matrimonio' 
        OR b.spouse_id IS NULL 
        OR b.id < b.spouse_id -- Solo toma uno de los dos del matrimonio
      )
    ORDER BY b.names;
  `
  const [rows] = await db.query(query, [community_id]);
  const result = rows as any[]
  return {
    success: true,
    message: "Consulta de ejemplo ejecutada correctamente",
    data: result
  }
}

export const createBrotherInDB = async (brother: Omit<BrotherwithRoles, "id" | "spouse_id">) => {
  const { names, civil_status, community_id, phone, roles } = brother;
  const query = `
    INSERT INTO brothers (names, civil_status, community_id, phone)
    VALUES (?, ?, ?, ?)
  `
  const [result] = await db.query(query, [
    names,
    civil_status,
    community_id,
    phone || null,
  ]);
  const brotherId = (result as any).insertId;

  if (roles && roles.length > 0) {
    const roleValues = roles.map(role => [brotherId, community_id, role]);
    const placeholders = roleValues.map(() => '(?, ?, ?)').join(', ');
    const queryRole = `
      INSERT INTO brother_roles (brother_id, community_id, role)
      VALUES  ${placeholders}
    `
    await db.query(queryRole, roleValues.flat());
  }

  return {
    success: true,
    message: "Hermano creado correctamente",
    data: { id: brotherId }
  }
}
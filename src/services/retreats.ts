import { db } from "@/lib/db";
import type { CreateRetreatInput, RetreatsGet } from "@/types/retreats";
import type { BrotherInvited, BrotherConfirmated } from "@/types/brothers";

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
    SELECT 
    p.id,
    p.names,
    p.civil_status,
    p.community_id,
    c.number_community,
    m.id AS marriage_id,
    -- Obtenemos el ID de la pareja mediante lógica de comparación simple sin subqueries
    CASE 
        WHEN m.person1_id = p.id THEN m.person2_id 
        ELSE m.person1_id 
    END AS spouse_id,
    -- Agregamos el nombre de la pareja por si lo necesitas en la UI
    spouse.names AS spouse_name,
    -- Agregamos el rol principal del hermano
    pr.role AS person_role
FROM persons p
INNER JOIN communities c ON p.community_id = c.id
INNER JOIN retreat_communities rc ON c.id = rc.community_id
-- Join con matrimonios
LEFT JOIN marriages m ON (p.id = m.person1_id OR p.id = m.person2_id)
-- Join con la tabla de personas de nuevo para traer datos del cónyuge rápidamente
LEFT JOIN persons spouse ON spouse.id = (CASE WHEN m.person1_id = p.id THEN m.person2_id ELSE m.person1_id END)
-- Join para traer el rol (opcional)
LEFT JOIN person_roles pr ON p.id = pr.person_id AND p.community_id = pr.community_id
-- El filtro clave: LEFT JOIN con los que ya asistieron
LEFT JOIN retreat_attendees ra ON ra.retreat_id = rc.retreat_id AND ra.person_id = p.id
WHERE rc.retreat_id = ? 
  AND ra.id IS NULL
ORDER BY c.number_community, p.names;
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

export const confirmRetreatAttendanceInDB = async (input: {
  retreat_id: number;
  person_ids: number[]; // Array de IDs
  observation?: string;
  retreat_house_id: number | null;
}) => {
  const { retreat_id, person_ids, observation, retreat_house_id } = input;

  try {
    // Validar que haya al menos un ID
    if (!person_ids || person_ids.length === 0) {
      return {
        success: false,
        message: "Debes proporcionar al menos una persona"
      };
    }

    // 1. Verificar que todas las personas estén en las comunidades invitadas
    const placeholders = person_ids.map(() => '?').join(',');
    const [rows] = await db.query(
      `SELECT p.id 
       FROM persons p
       INNER JOIN retreat_communities rc ON p.community_id = rc.community_id
       WHERE p.id IN (${placeholders}) AND rc.retreat_id = ?`,
      [...person_ids, retreat_id]
    );
    const invited = (rows as any[]).map(row => row.id);
    if (invited.length !== person_ids.length) {
      return {
        success: false,
        message: "Algunas personas no están en las comunidades invitadas"
      };
    }

    // 2. Verificar cuáles ya están confirmados
    const [alreadyConfirmedRows] = await db.query(
      `SELECT person_id FROM retreat_attendees 
       WHERE retreat_id = ? AND person_id IN (${placeholders})`,
      [retreat_id, ...person_ids]
    );
    const alreadyConfirmed = alreadyConfirmedRows as any[];
    const confirmedIds = alreadyConfirmed.map(row => row.person_id);
    const newIds = person_ids.filter(id => !confirmedIds.includes(id));

    if (newIds.length === 0) {
      return {
        success: false,
        message: "Todas las personas ya están confirmadas"
      };
    }

    // 3. Insertar confirmaciones para los que no están confirmados
    const attendeeValues = newIds.map(id => [
      retreat_id,
      id,
      observation || null,
      retreat_house_id,
    ]);
    const attendeePlaceholders = attendeeValues.map(() => '(?, ?, ?, ?)').join(', ');

    await db.execute(
      `INSERT INTO retreat_attendees (retreat_id, person_id, observation, retreat_house_id)
       VALUES ${attendeePlaceholders}`,
      attendeeValues.flat()
    );

    // 4. Si hay observación y algunos ya estaban confirmados, actualizar su observación
    if (observation && confirmedIds.length > 0) {
      const updatePlaceholders = confirmedIds.map(() => '?').join(',');
      await db.execute(
        `UPDATE retreat_attendees 
         SET observation = ? 
         WHERE retreat_id = ? AND person_id IN (${updatePlaceholders})
         AND (observation IS NULL OR observation = '')`,
        [observation, retreat_id, ...confirmedIds]
      );
    }

    // 5. Si se envía casa de retiro y algunos ya estaban confirmados, actualizar su hospedaje
    if (retreat_house_id !== null && confirmedIds.length > 0) {
      const updatePlaceholders = confirmedIds.map(() => '?').join(',');
      await db.execute(
        `UPDATE retreat_attendees
         SET retreat_house_id = ?
         WHERE retreat_id = ? AND person_id IN (${updatePlaceholders})`,
        [retreat_house_id, retreat_id, ...confirmedIds]
      );
    }

    return {
      success: true,
      message: `${newIds.length} persona(s) confirmada(s) exitosamente`,
      data: {
        confirmed: newIds.length,
        already_confirmed: confirmedIds.length,
        total: person_ids.length
      }
    };

  } catch (error: any) {
    console.error("Error confirming attendance:", error);
    return {
      success: false,
      message: "Error al confirmar asistencia"
    };
  }
};

export const deleteRetreatAttendanceGroupInDB = async (input: {
  retreat_id: number;
  person_ids: number[];
}) => {
  const { retreat_id, person_ids } = input;

  if (!person_ids || person_ids.length === 0) {
    return {
      success: false,
      message: "Debes proporcionar al menos una persona",
    };
  }

  const placeholders = person_ids.map(() => "?").join(",");

  try {
    await db.execute(
      `DELETE FROM retreat_attendees
       WHERE retreat_id = ? AND person_id IN (${placeholders})`,
      [retreat_id, ...person_ids],
    );

    return {
      success: true,
      message: "Confirmación eliminada correctamente",
    };
  } catch (error) {
    console.error("Error deleting attendance group:", error);
    return {
      success: false,
      message: "Error al eliminar confirmación",
    };
  }
};

export const updateRetreatAttendanceGroupInDB = async (input: {
  retreat_id: number;
  person_ids: number[];
  observation?: string;
  retreat_house_id: number | null;
}) => {
  const { retreat_id, person_ids, observation, retreat_house_id } = input;

  if (!person_ids || person_ids.length === 0) {
    return {
      success: false,
      message: "Debes proporcionar al menos una persona",
    };
  }

  const placeholders = person_ids.map(() => "?").join(",");

  try {
    await db.execute(
      `UPDATE retreat_attendees
       SET observation = ?, retreat_house_id = ?
       WHERE retreat_id = ? AND person_id IN (${placeholders})`,
      [observation || null, retreat_house_id, retreat_id, ...person_ids],
    );

    return {
      success: true,
      message: "Asistencia actualizada correctamente",
    };
  } catch (error) {
    console.error("Error updating attendance group:", error);
    return {
      success: false,
      message: "Error al actualizar asistencia",
    };
  }
};

interface GroupedData {
  parroquia: string;
  comunidades: {
    numero: number;
    confirmados: BrotherConfirmated[];
  }[];
}

export const getRetreatConfirmedAttendeesFromDB = async (retreat_id: number) => {
  const query = `
    SELECT 
        p_parent.name AS parroquia, -- Nombre de la parroquia
        IFNULL(m.id, CONCAT('p', p.id)) AS group_key,
        GROUP_CONCAT(p.names ORDER BY p.id SEPARATOR ' y ') AS nombres_confirmados,
        GROUP_CONCAT(DISTINCT ra.observation SEPARATOR ' / ') AS observaciones_combinadas,
        MAX(ra.retreat_house_id) AS retreat_house_id,
        MAX(rh.name) AS retreat_house_name,
        GROUP_CONCAT(p.id ORDER BY p.id) AS person_ids,
        c.number_community,
        m.id AS marriage_id
    FROM retreat_attendees ra
    JOIN persons p ON ra.person_id = p.id
    JOIN communities c ON p.community_id = c.id
    JOIN parishes p_parent ON c.parish_id = p_parent.id -- Unimos con parroquias
    LEFT JOIN marriages m ON (p.id = m.person1_id OR p.id = m.person2_id)
    LEFT JOIN retreat_houses rh ON ra.retreat_house_id = rh.id
    WHERE ra.retreat_id = ?
    GROUP BY 
        group_key, 
        p_parent.name,
        c.number_community, 
        m.id
    ORDER BY p_parent.name, c.number_community;
  `;

  const [rows] = await db.query(query, [retreat_id]);
  const attendees = (rows as any[]).map((row) => ({
    ...row,
    person_ids: String(row.person_ids)
      .split(",")
      .map((v) => Number(v))
      .filter((n) => !Number.isNaN(n)),
  })) as BrotherConfirmated[];

  const structuredData = attendees.reduce((acc: GroupedData[], curr) => {
    // 1. Buscar si ya existe la parroquia en el acumulador
    let parish = acc.find(p => p.parroquia === curr.parroquia);

    if (!parish) {
      parish = { parroquia: curr.parroquia, comunidades: [] };
      acc.push(parish);
    }

    // 2. Buscar si ya existe la comunidad dentro de esa parroquia
    let community = parish.comunidades.find(c => c.numero === curr.number_community);

    if (!community) {
      community = { numero: curr.number_community, confirmados: [] };
      parish.comunidades.push(community);
    }

    // 3. Insertar el hermano/pareja en la comunidad correspondiente
    community.confirmados.push(curr);

    return acc;
  }, []);

  return {
    success: true,
    message: "Asistentes confirmados obtenidos con éxito",
    data: structuredData
  };
};
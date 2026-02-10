import { db } from "@/lib/db";
import type { CreateRetreatInput, RetreatsGet, RetreatConf, StatsConf, ParishesConf, AttendeesConf, CommunityInfo } from "@/types/retreats";
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

export const updateRetreatAttendeesStatusInDB = async (input: {
  retreat_id: number;
  attended_person_ids: number[];
  not_attended_person_ids: number[];
}) => {
  const { retreat_id, attended_person_ids, not_attended_person_ids } = input;

  if (!retreat_id) {
    return {
      success: false,
      message: "Debes proporcionar un ID de convivencia válido",
    };
  }

  if (
    (!attended_person_ids || attended_person_ids.length === 0) &&
    (!not_attended_person_ids || not_attended_person_ids.length === 0)
  ) {
    return {
      success: false,
      message: "Debes proporcionar al menos una persona para actualizar asistencia",
    };
  }

  try {
    if (attended_person_ids.length > 0) {
      const attendedPlaceholders = attended_person_ids.map(() => "?").join(",");
      await db.execute(
        `UPDATE retreat_attendees
         SET attended = TRUE
         WHERE retreat_id = ? AND person_id IN (${attendedPlaceholders})`,
        [retreat_id, ...attended_person_ids],
      );
    }

    if (not_attended_person_ids.length > 0) {
      const notAttendedPlaceholders = not_attended_person_ids
        .map(() => "?")
        .join(",");
      await db.execute(
        `UPDATE retreat_attendees
         SET attended = FALSE
         WHERE retreat_id = ? AND person_id IN (${notAttendedPlaceholders})`,
        [retreat_id, ...not_attended_person_ids],
      );
    }

    return {
      success: true,
      message: "Asistencia de hermanos actualizada correctamente",
    };
  } catch (error) {
    console.error("Error updating attendees 'attended' status:", error);
    return {
      success: false,
      message: "Error al actualizar asistencia de hermanos",
    };
  }
};

export const updateRetreatStatusInDB = async (input: {
  retreat_id: number;
  status: "planificacion" | "en_curso" | "finalizada";
}) => {
  const { retreat_id, status } = input;

  if (!retreat_id) {
    return {
      success: false,
      message: "Debes proporcionar un ID de convivencia válido",
    };
  }

  try {
    const [result] = await db.execute(
      `UPDATE retreats SET status = ? WHERE id = ?`,
      [status, retreat_id],
    );

    const affectedRows = (result as any).affectedRows ?? 0;

    if (affectedRows === 0) {
      return {
        success: false,
        message: "Convivencia no encontrada",
      };
    }

    return {
      success: true,
      message: "Estado de la convivencia actualizado correctamente",
    };
  } catch (error) {
    console.error("Error updating retreat status:", error);
    return {
      success: false,
      message: "Error al actualizar el estado de la convivencia",
    };
  }
};

export const getRetreatConfirmedAttendeesFromDB = async (retreat_id: number) => {
  try {
    // 1. QUERY: Datos de la convivencia
    const [retreatData] = await db.query(
      `SELECT 
        title,
        start_date,
        end_date,
        cost_per_person,
        status
       FROM retreats 
       WHERE id = ?`,
      [retreat_id]
    );
    const retreatInfo = retreatData as RetreatConf[];

    if (!retreatInfo || retreatInfo.length === 0) {
      return {
        success: false,
        message: "Convivencia no encontrada",
        data: null
      };
    }

    const retreat = retreatInfo[0];

    // 2. QUERY: Estadísticas generales
    const [statsData] = await db.query(
      `SELECT 
        COUNT(DISTINCT p.id) AS total_personas,
        COUNT(DISTINCT m.id) AS total_matrimonios,
        COUNT(DISTINCT CASE WHEN m.id IS NULL AND p.civil_status = 'soltero' THEN p.id END) AS total_solteros,
        COUNT(DISTINCT CASE WHEN m.id IS NULL AND p.civil_status = 'soltera' THEN p.id END) AS total_solteras
       FROM retreat_attendees ra
       JOIN persons p ON ra.person_id = p.id
       LEFT JOIN marriages m ON (p.id = m.person1_id OR p.id = m.person2_id)
       WHERE ra.retreat_id = ?`,
      [retreat_id]
    );
    const stats = statsData as StatsConf[];

    const estadisticas = stats[0];

    // 2b. QUERY: Personas marcadas como que asistieron (attended = TRUE)
    const [attendedRows] = await db.query(
      `SELECT person_id FROM retreat_attendees WHERE retreat_id = ? AND attended = TRUE`,
      [retreat_id],
    );
    const attendedPersonIds = (attendedRows as { person_id: number }[]).map(
      (row) => row.person_id,
    );

    // 3. QUERY: Parroquias y comunidades participantes con sus estadísticas
    const [parishesData] = await db.query(
      `SELECT DISTINCT
        pa.id AS parish_id,
        pa.name AS parish_name,
        c.id AS community_id,
        c.number_community,
        (
          SELECT COUNT(DISTINCT p2.id)
          FROM retreat_attendees ra2
          JOIN persons p2 ON ra2.person_id = p2.id
          WHERE ra2.retreat_id = ? AND p2.community_id = c.id
        ) AS community_total_personas,
        (
          SELECT COUNT(DISTINCT m2.id)
          FROM retreat_attendees ra2
          JOIN persons p2 ON ra2.person_id = p2.id
          LEFT JOIN marriages m2 ON (p2.id = m2.person1_id OR p2.id = m2.person2_id)
          WHERE ra2.retreat_id = ? AND p2.community_id = c.id AND m2.id IS NOT NULL
        ) AS community_total_matrimonios,
        (
          SELECT COUNT(DISTINCT p2.id)
          FROM retreat_attendees ra2
          JOIN persons p2 ON ra2.person_id = p2.id
          LEFT JOIN marriages m2 ON (p2.id = m2.person1_id OR p2.id = m2.person2_id)
          WHERE ra2.retreat_id = ? AND p2.community_id = c.id AND m2.id IS NULL AND p2.civil_status = 'soltero'
        ) AS community_total_solteros,
        (
          SELECT COUNT(DISTINCT p2.id)
          FROM retreat_attendees ra2
          JOIN persons p2 ON ra2.person_id = p2.id
          LEFT JOIN marriages m2 ON (p2.id = m2.person1_id OR p2.id = m2.person2_id)
          WHERE ra2.retreat_id = ? AND p2.community_id = c.id AND m2.id IS NULL AND p2.civil_status = 'soltera'
        ) AS community_total_solteras
       FROM retreat_attendees ra
       JOIN persons p ON ra.person_id = p.id
       JOIN communities c ON p.community_id = c.id
       JOIN parishes pa ON c.parish_id = pa.id
       WHERE ra.retreat_id = ?
       ORDER BY pa.name, c.number_community`,
      [retreat_id, retreat_id, retreat_id, retreat_id, retreat_id]
    );
    const parishesInfo = parishesData as ParishesConf[];

    // 4. QUERY: Hermanos confirmados agrupados
    const [attendeesData] = await db.query(
      `SELECT 
        p.community_id,
        IFNULL(m.id, CONCAT('p', p.id)) AS group_key,
        GROUP_CONCAT(p.names ORDER BY p.id SEPARATOR ' y ') AS nombres_confirmados,
        GROUP_CONCAT(DISTINCT ra.observation SEPARATOR ' / ') AS observaciones_combinadas,
        MAX(ra.retreat_house_id) AS retreat_house_id,
        MAX(rh.name) AS retreat_house_name,
        GROUP_CONCAT(p.id ORDER BY p.id) AS person_ids,
        m.id AS marriage_id,
        CASE 
          WHEN m.id IS NOT NULL THEN 'matrimonio'
          ELSE MAX(p.civil_status)
        END AS civil_status
       FROM retreat_attendees ra
       JOIN persons p ON ra.person_id = p.id
       LEFT JOIN marriages m ON (p.id = m.person1_id OR p.id = m.person2_id)
       LEFT JOIN retreat_houses rh ON ra.retreat_house_id = rh.id
       WHERE ra.retreat_id = ?
       GROUP BY 
         p.community_id,
         group_key,
         m.id
       ORDER BY p.community_id`,
      [retreat_id]
    );
    const attendeesInfo = attendeesData as AttendeesConf[];

    // 5. ESTRUCTURAR DATOS
    interface ParishMapValue {
      parroquia: string;
      comunidades: (CommunityInfo & { community_id: number })[];
    }

    const parishesMap = new Map<number, ParishMapValue>();

    // Agrupar parroquias y comunidades
    parishesInfo.forEach((row) => {
      if (!parishesMap.has(row.parish_id)) {
        parishesMap.set(row.parish_id, {
          parroquia: row.parish_name,
          comunidades: [],
        });
      }

      const parish = parishesMap.get(row.parish_id)!;
      parish.comunidades.push({
        numero: row.number_community,
        community_id: row.community_id,
        estadisticas: {
          total_personas: row.community_total_personas,
          total_matrimonios: row.community_total_matrimonios,
          total_solteros: row.community_total_solteros,
          total_solteras: row.community_total_solteras,
        },
        confirmados: [],
      });
    });

    // Asignar hermanos confirmados a sus comunidades
    attendeesInfo.forEach((attendee) => {
      for (const parish of parishesMap.values()) {
        const community = parish.comunidades.find(
          (c) => c.community_id === attendee.community_id,
        );

        if (community) {
          community.confirmados.push({
            group_key: attendee.group_key,
            nombres_confirmados: attendee.nombres_confirmados,
            observaciones_combinadas: attendee.observaciones_combinadas,
            retreat_house_id: attendee.retreat_house_id,
            retreat_house_name: attendee.retreat_house_name,
            person_ids: attendee.person_ids.split(",").map(Number),
            marriage_id: attendee.marriage_id,
            civil_status: attendee.civil_status,
          });
          break;
        }
      }
    });

    // 6. RETORNAR ESTRUCTURA FINAL
    return {
      success: true,
      message: "Asistentes confirmados obtenidos con éxito",
      data: {
        convivencia: {
          titulo: retreat.title,
          fecha_inicio: retreat.start_date,
          fecha_fin: retreat.end_date,
          costo_por_persona: retreat.cost_per_person,
          status: retreat.status
        },
        estadisticas: {
          total_personas: estadisticas.total_personas,
          total_matrimonios: estadisticas.total_matrimonios,
          total_solteros: estadisticas.total_solteros,
          total_solteras: estadisticas.total_solteras
        },
        attended_person_ids: attendedPersonIds,
        parroquias: Array.from(parishesMap.values()).map((parish) => ({
          parroquia: parish.parroquia,
          comunidades: parish.comunidades.map(({ community_id, ...rest }) => rest),
        })),
      }
    };

  } catch (error) {
    console.error("Error al obtener asistentes confirmados:", error);
    return {
      success: false,
      message: "Error al obtener asistentes confirmados",
      data: null
    };
  }
};

export const getRetreatCommunityChargesFromDB = async (retreat_id: number) => {
  try {
    // Datos básicos de la convivencia (para costo por persona y título)
    const [retreatRows] = await db.query(
      `SELECT id, title, cost_per_person FROM retreats WHERE id = ?`,
      [retreat_id],
    );

    const retreatData = retreatRows as { id: number; title: string; cost_per_person: any }[];

    if (!retreatData || retreatData.length === 0) {
      return {
        success: false,
        message: "Convivencia no encontrada",
        data: null,
      };
    }

    const retreatRow = retreatData[0];
    const costPerPerson = Number(retreatRow.cost_per_person ?? 0);

    // Comunidades con asistentes que realmente participaron (attended = TRUE)
    const [communityRows] = await db.query(
      `SELECT
         pa.name AS parish_name,
         c.id AS community_id,
         c.number_community,
         COUNT(DISTINCT CASE WHEN ra.attended = TRUE THEN p.id END) AS total_attendees
       FROM retreat_attendees ra
       JOIN persons p ON ra.person_id = p.id
       JOIN communities c ON p.community_id = c.id
       JOIN parishes pa ON c.parish_id = pa.id
       WHERE ra.retreat_id = ?
       GROUP BY pa.name, c.id, c.number_community
       HAVING total_attendees > 0
       ORDER BY pa.name, c.number_community`,
      [retreat_id],
    );

    const communities = (communityRows as {
      parish_name: string;
      community_id: number;
      number_community: number;
      total_attendees: number;
    }[]).map((row) => {
      const total_cost = row.total_attendees * costPerPerson;
      return {
        parish_name: row.parish_name,
        community_id: row.community_id,
        number_community: row.number_community,
        total_attendees: row.total_attendees,
        total_cost,
      };
    });

    return {
      success: true,
      message: "Cargos por comunidad obtenidos con éxito",
      data: {
        retreat: {
          id: retreatRow.id,
          title: retreatRow.title,
          cost_per_person: costPerPerson,
        },
        communities,
      },
    };
  } catch (error) {
    console.error("Error al obtener cargos por comunidad:", error);
    return {
      success: false,
      message: "Error al obtener cargos por comunidad",
      data: null,
    };
  }
};
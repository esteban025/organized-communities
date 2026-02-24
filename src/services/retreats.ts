import { db } from "@/lib/db";
import type { CreateRetreatInput, RetreatsGet, RetreatConf, StatsConf, ParishesConf, AttendeesConf, CommunityInfo, RetreatHistory } from "@/types/retreats";
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
    ORDER BY r.id DESC;
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
      CASE 
          WHEN m.person1_id = p.id THEN m.person2_id 
          ELSE m.person1_id 
      END AS spouse_id,
      spouse.names AS spouse_name,
      pr.role AS person_role
    FROM persons p
    INNER JOIN communities c ON p.community_id = c.id
    INNER JOIN retreat_communities rc ON rc.community_id = c.id AND rc.retreat_id = ?
    LEFT JOIN marriages m ON (p.id = m.person1_id OR p.id = m.person2_id)
    LEFT JOIN persons spouse ON spouse.id = (CASE WHEN m.person1_id = p.id THEN m.person2_id ELSE m.person1_id END)
    LEFT JOIN person_roles pr ON p.id = pr.person_id AND p.community_id = pr.community_id
    LEFT JOIN retreat_attendees ra ON ra.retreat_id = rc.retreat_id AND ra.person_id = p.id
    WHERE (ra.id IS NULL OR ra.confirmation = FALSE)
    ORDER BY c.number_community, p.names;
  `;
  const [rows] = await db.query(query, [id]);
  const data = rows as BrotherInvited[];
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
  person_ids: number[];
  observation?: string;
  retreat_house_id: number | null;
}) => {
  const { retreat_id, person_ids, observation, retreat_house_id } = input;

  try {
    if (!person_ids || person_ids.length === 0) {
      return {
        success: false,
        message: "Debes proporcionar al menos una persona"
      };
    }

    const placeholders = person_ids.map(() => '?').join(',');

    // Verificar cuáles ya tienen registro en retreat_attendees
    const [existingRows] = await db.query(
      `SELECT person_id FROM retreat_attendees 
       WHERE retreat_id = ? AND person_id IN (${placeholders})`,
      [retreat_id, ...person_ids]
    );
    const existingIds = new Set((existingRows as any[]).map(r => r.person_id));

    const toInsert = person_ids.filter(id => !existingIds.has(id));
    const toUpdate = person_ids.filter(id => existingIds.has(id));

    // Insertar nuevos registros con confirmation = TRUE
    if (toInsert.length > 0) {
      const values = toInsert.map(id => [retreat_id, id, observation || null, retreat_house_id, true]);
      const insertPlaceholders = values.map(() => '(?, ?, ?, ?, ?)').join(', ');
      await db.execute(
        `INSERT INTO retreat_attendees (retreat_id, person_id, observation, retreat_house_id, confirmation)
         VALUES ${insertPlaceholders}`,
        values.flat()
      );
    }

    // Actualizar existentes a confirmation = TRUE
    if (toUpdate.length > 0) {
      const updatePlaceholders = toUpdate.map(() => '?').join(',');
      await db.execute(
        `UPDATE retreat_attendees
         SET confirmation = TRUE, observation = ?, retreat_house_id = ?
         WHERE retreat_id = ? AND person_id IN (${updatePlaceholders})`,
        [observation || null, retreat_house_id, retreat_id, ...toUpdate]
      );
    }

    const totalConfirmed = toInsert.length + toUpdate.length;

    return {
      success: true,
      message: `${totalConfirmed} persona(s) confirmada(s) exitosamente`,
      data: {
        confirmed: totalConfirmed,
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

    // Queries 2, 2b, 3 y 4 son independientes entre sí → ejecutar en paralelo
    const [
      [statsData],
      [attendedRows],
      [parishesData],
      [attendeesData],
    ] = await Promise.all([
      // 2. QUERY: Estadísticas generales
      db.query(
        `SELECT 
          COUNT(DISTINCT p.id) AS total_personas,
          
          -- Matrimonios completos (ambos cónyuges asistieron)
          COUNT(DISTINCT CASE 
            WHEN m.id IS NOT NULL 
              AND EXISTS (
                SELECT 1 FROM retreat_attendees ra2 
                WHERE ra2.retreat_id = ? AND ra2.confirmation = TRUE AND ra2.person_id = m.person1_id
              )
              AND EXISTS (
                SELECT 1 FROM retreat_attendees ra2 
                WHERE ra2.retreat_id = ? AND ra2.confirmation = TRUE AND ra2.person_id = m.person2_id
              )
            THEN m.id 
          END) AS total_matrimonios,
          
          -- Solteros: nunca casados O matrimonios incompletos donde el que asiste tiene ID menor
          COUNT(DISTINCT CASE 
            WHEN m.id IS NULL AND p.civil_status = 'soltero' THEN p.id
            WHEN m.id IS NOT NULL
              AND NOT EXISTS (
                SELECT 1 FROM retreat_attendees ra_spouse 
                WHERE ra_spouse.retreat_id = ? AND ra_spouse.confirmation = TRUE
                AND ra_spouse.person_id = CASE WHEN p.id = m.person1_id THEN m.person2_id ELSE m.person1_id END
              )
              AND p.id < CASE WHEN p.id = m.person1_id THEN m.person2_id ELSE m.person1_id END
              THEN p.id
            END) AS total_solteros,
          
          -- Solteras: nunca casadas O matrimonios incompletos donde el que asiste tiene ID mayor
          COUNT(DISTINCT CASE 
            WHEN m.id IS NULL AND p.civil_status = 'soltera' THEN p.id
            WHEN m.id IS NOT NULL
              AND NOT EXISTS (
                SELECT 1 FROM retreat_attendees ra_spouse 
                WHERE ra_spouse.retreat_id = ? AND ra_spouse.confirmation = TRUE
                AND ra_spouse.person_id = CASE WHEN p.id = m.person1_id THEN m.person2_id ELSE m.person1_id END
              )
              AND p.id > CASE WHEN p.id = m.person1_id THEN m.person2_id ELSE m.person1_id END
              THEN p.id
            END) AS total_solteras
          
        FROM retreat_attendees ra
        JOIN persons p ON ra.person_id = p.id
        LEFT JOIN marriages m ON (p.id = m.person1_id OR p.id = m.person2_id)
        WHERE ra.retreat_id = ? AND ra.confirmation = TRUE`,
        [retreat_id, retreat_id, retreat_id, retreat_id, retreat_id]
      ),

      // 2b. QUERY: Personas marcadas como que asistieron (attended = TRUE)
      db.query(
        `SELECT person_id FROM retreat_attendees WHERE retreat_id = ? AND attended = TRUE`,
        [retreat_id],
      ),

      // 3. QUERY: Parroquias y comunidades participantes (sin subconsultas de estadísticas)
      db.query(
        `SELECT DISTINCT
          pa.id AS parish_id,
          pa.name AS parish_name,
          c.id AS community_id,
          c.number_community
         FROM retreat_attendees ra
         JOIN persons p ON ra.person_id = p.id
         JOIN communities c ON p.community_id = c.id
         JOIN parishes pa ON c.parish_id = pa.id
         WHERE ra.retreat_id = ? AND ra.confirmation = TRUE
         ORDER BY pa.name, c.number_community`,
        [retreat_id]
      ),

      // 4. QUERY: Hermanos confirmados agrupados
      db.query(
        `SELECT 
          p.community_id,
          IFNULL(m.id, CONCAT('p', p.id)) AS group_key,
          GROUP_CONCAT(p.names ORDER BY p.id SEPARATOR ' y ') AS nombres_confirmados,
          GROUP_CONCAT(DISTINCT ra.observation SEPARATOR ' / ') AS observaciones_combinadas,
          MAX(ra.retreat_house_id) AS retreat_house_id,
          MAX(rh.name) AS retreat_house_name,
          GROUP_CONCAT(p.id ORDER BY p.id) AS person_ids,
          m.id AS marriage_id,
          MAX(m.person1_id) AS marriage_person1_id,
          MAX(m.person2_id) AS marriage_person2_id,
          CASE 
            WHEN m.id IS NOT NULL THEN 'matrimonio'
            ELSE MAX(p.civil_status)
          END AS civil_status
         FROM retreat_attendees ra
         JOIN persons p ON ra.person_id = p.id
         LEFT JOIN marriages m ON (p.id = m.person1_id OR p.id = m.person2_id)
         LEFT JOIN retreat_houses rh ON ra.retreat_house_id = rh.id
         WHERE ra.retreat_id = ? AND ra.confirmation = TRUE
         GROUP BY 
           p.community_id,
           group_key,
           m.id
         ORDER BY p.community_id`,
        [retreat_id]
      ),
    ]);

    const stats = statsData as StatsConf[];
    const estadisticas = stats[0];

    const attendedPersonIds = (attendedRows as { person_id: number }[]).map(
      (row) => row.person_id,
    );

    const parishesInfo = parishesData as ParishesConf[];
    const attendeesInfo = attendeesData as AttendeesConf[];

    // 5. ESTRUCTURAR DATOS

    // Estructura interna con campos extra para calcular estadísticas
    interface ConfirmadoInternal {
      group_key: string;
      nombres_confirmados: string;
      observaciones_combinadas: string | null;
      retreat_house_id: number | null;
      retreat_house_name: string | null;
      person_ids: number[];
      marriage_id: number | null;
      civil_status: string;
      marriage_person1_id: number | null;
      marriage_person2_id: number | null;
    }

    interface CommunityInternal {
      community_id: number;
      numero: string;
      estadisticas: StatsConf;
      confirmados: ConfirmadoInternal[];
    }

    interface ParishMapValue {
      parroquia: string;
      comunidades: CommunityInternal[];
    }

    const parishesMap = new Map<number, ParishMapValue>();

    // Agrupar parroquias y comunidades (sin estadísticas aún)
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
          total_personas: 0,
          total_matrimonios: 0,
          total_solteros: 0,
          total_solteras: 0,
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
            marriage_person1_id: attendee.marriage_person1_id,
            marriage_person2_id: attendee.marriage_person2_id,
          });
          break;
        }
      }
    });

    // Calcular estadísticas por comunidad a partir de los confirmados
    for (const parish of parishesMap.values()) {
      for (const community of parish.comunidades) {
        const stats_comm = { total_personas: 0, total_matrimonios: 0, total_solteros: 0, total_solteras: 0 };
        for (const conf of community.confirmados) {
          const status = String(conf.civil_status || "").trim().toLowerCase();

          if (status === "matrimonio") {
            const confirmedIds = conf.person_ids;
            const bothConfirmed = confirmedIds.length === 2;

            if (bothConfirmed) {
              // Matrimonio completo: ambos cónyuges confirmados
              stats_comm.total_personas += 2;
              stats_comm.total_matrimonios += 1;
            } else {
              // Matrimonio incompleto: solo un cónyuge confirmado
              // Si es person1_id (id menor) → soltero, si es person2_id (id mayor) → soltera
              stats_comm.total_personas += 1;
              const confirmedId = confirmedIds[0];
              if (confirmedId === conf.marriage_person1_id) {
                stats_comm.total_solteros += 1;
              } else {
                stats_comm.total_solteras += 1;
              }
            }
          } else if (status === "soltero") {
            stats_comm.total_personas += 1;
            stats_comm.total_solteros += 1;
          } else if (status === "soltera") {
            stats_comm.total_personas += 1;
            stats_comm.total_solteras += 1;
          } else {
            stats_comm.total_personas += 1;
          }
        }
        community.estadisticas = stats_comm;
      }
    }

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
          comunidades: parish.comunidades.map(({ community_id, ...rest }) => ({
            ...rest,
            confirmados: rest.confirmados.map(({ marriage_person1_id, marriage_person2_id, ...conf }) => conf),
          })),
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
    // y posibles registros de cobros guardados (retreat_charges)
    const [communityRows] = await db.query(
      `SELECT
         pa.name AS parish_name,
         c.id AS community_id,
         c.number_community,
         COUNT(DISTINCT CASE WHEN ra.attended = TRUE THEN p.id END) AS total_attendees,
         rcg.total_debt
       FROM retreat_attendees ra
       JOIN persons p ON ra.person_id = p.id
       JOIN communities c ON p.community_id = c.id
       JOIN parishes pa ON c.parish_id = pa.id
       LEFT JOIN retreat_charges rcg
         ON rcg.retreat_id = ra.retreat_id AND rcg.community_id = c.id
       WHERE ra.retreat_id = ?
       GROUP BY pa.name, c.id, c.number_community, rcg.total_debt
       HAVING total_attendees > 0
       ORDER BY pa.name, c.number_community`,
      [retreat_id],
    );

    const communities = (communityRows as {
      parish_name: string;
      community_id: number;
      number_community: number;
      total_attendees: number;
      total_debt: number | null;
    }[]).map((row) => {
      const total_cost = row.total_attendees * costPerPerson;
      const total_debt =
        row.total_debt != null ? Number(row.total_debt) : total_cost;
      return {
        parish_name: row.parish_name,
        community_id: row.community_id,
        number_community: row.number_community,
        total_attendees: row.total_attendees,
        total_cost,
        total_debt,
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

export const saveRetreatCommunityPaymentsInDB = async (input: {
  retreat_id: number;
  payments: {
    community_id: number;
    total_attendees: number;
    total_cost: number;
    amount_paid: number;
  }[];
}) => {
  const { retreat_id, payments } = input;

  if (!retreat_id || !payments || payments.length === 0) {
    return {
      success: false,
      message: "Debes proporcionar convivencia y al menos un pago",
    };
  }

  try {
    const values: any[] = [];
    const placeholders = payments
      .map(() => "(?, ?, ?, ?, ?)")
      .join(", ");

    for (const p of payments) {
      const safeTotalCost = Number(p.total_cost ?? 0);
      const safePaid = Math.max(Number(p.amount_paid ?? 0), 0);
      const total_debt = Math.max(safeTotalCost - safePaid, 0);
      values.push(
        retreat_id,
        p.community_id,
        p.total_attendees,
        safeTotalCost,
        total_debt,
      );
    }

    await db.query(
      `INSERT INTO retreat_charges (retreat_id, community_id, total_attendees, total_cost, total_debt)
       VALUES ${placeholders}
       ON DUPLICATE KEY UPDATE
         total_attendees = VALUES(total_attendees),
         total_cost = VALUES(total_cost),
         total_debt = VALUES(total_debt)`,
      values,
    );

    return {
      success: true,
      message: "Pagos de comunidades guardados correctamente",
    };
  } catch (error) {
    console.error("Error al guardar pagos de comunidades:", error);
    return {
      success: false,
      message: "Error al guardar pagos de comunidades",
    };
  }
};

export const getRetreatCommunityLetterDataFromDB = async (
  retreat_id: number,
  community_id: number,
) => {
  try {
    // Datos de convivencia y comunidad (título, fechas, costo, parroquia, número y responsable)
    const [baseRows] = await db.query(
      `SELECT
         r.id AS retreat_id,
         r.title,
         r.start_date,
         r.end_date,
         r.cost_per_person,
         pa.name AS parish_name,
         c.id AS community_id,
         c.number_community,
         (
           SELECT p.names
           FROM person_roles pr
           INNER JOIN persons p ON pr.person_id = p.id
           WHERE pr.community_id = c.id AND pr.role = 'responsable'
           ORDER BY p.id ASC
           LIMIT 1
         ) AS responsable
       FROM communities c
       INNER JOIN parishes pa ON c.parish_id = pa.id
       INNER JOIN retreat_communities rc ON rc.community_id = c.id AND rc.retreat_id = ?
       INNER JOIN retreats r ON r.id = rc.retreat_id
       WHERE c.id = ?
       LIMIT 1`,
      [retreat_id, community_id],
    );

    const baseData = baseRows as any[];

    if (!baseData || baseData.length === 0) {
      return {
        success: false,
        message: "No se encontró información para la comunidad en esta convivencia",
        data: null,
      };
    }

    const base = baseData[0] as {
      retreat_id: number;
      title: string;
      start_date: string;
      end_date: string;
      cost_per_person: any;
      parish_name: string;
      community_id: number;
      number_community: number;
      responsable: string | null;
    };

    const costPerPerson = Number(base.cost_per_person ?? 0);

    // Personas que realmente asistieron (attended = TRUE) de esa comunidad en esa convivencia
    const [attendeeRows] = await db.query(
      `SELECT
         p.id,
         p.names,
         CASE
           WHEN m.id IS NOT NULL THEN 'matrimonio'
           ELSE p.civil_status
         END AS civil_status,
         rh.name AS retreat_house_name
       FROM retreat_attendees ra
       INNER JOIN persons p ON ra.person_id = p.id
       INNER JOIN communities c ON p.community_id = c.id
       LEFT JOIN marriages m ON (p.id = m.person1_id OR p.id = m.person2_id)
       LEFT JOIN retreat_houses rh ON ra.retreat_house_id = rh.id
       WHERE ra.retreat_id = ?
         AND c.id = ?
         AND ra.attended = TRUE
       ORDER BY p.names`,
      [retreat_id, community_id],
    );

    const attendees = attendeeRows as {
      id: number;
      names: string;
      civil_status: string;
      retreat_house_name: string | null;
    }[];

    const totalAttendees = attendees.length;
    const computedTotalCost = totalAttendees * costPerPerson;

    // Intentar obtener la deuda registrada en retreat_charges (si existe)
    const [chargeRows] = await db.query(
      `SELECT total_cost, total_debt
       FROM retreat_charges
       WHERE retreat_id = ? AND community_id = ?
       LIMIT 1`,
      [retreat_id, community_id],
    );

    let totalCost = computedTotalCost;
    let totalDebt = computedTotalCost;

    if (Array.isArray(chargeRows) && chargeRows.length > 0) {
      const charge = chargeRows[0] as {
        total_cost: any;
        total_debt: any;
      };
      totalCost = Number(charge.total_cost ?? computedTotalCost);
      totalDebt = Number(charge.total_debt ?? totalCost);
    }

    return {
      success: true,
      message: "Datos de carta de cobro obtenidos con éxito",
      data: {
        retreat: {
          id: base.retreat_id,
          title: base.title,
          start_date: base.start_date,
          end_date: base.end_date,
          cost_per_person: costPerPerson,
        },
        community: {
          id: base.community_id,
          parish_name: base.parish_name,
          number_community: base.number_community,
          responsable: base.responsable ?? "Responsable",
        },
        attendees,
        totals: {
          total_attendees: totalAttendees,
          total_cost: totalCost,
          total_debt: totalDebt,
        },
      },
    };
  } catch (error) {
    console.error("Error al obtener datos de carta de comunidad:", error);
    return {
      success: false,
      message: "Error al obtener datos de carta de comunidad",
      data: null,
    };
  }
};

export const getRetreatsHistoryFromDB = async () => {
  try {
    const [rows] = await db.query(
      `SELECT
         r.id,
         r.title,
         r.start_date,
         r.end_date,
         (
           SELECT COUNT(DISTINCT rc.community_id)
           FROM retreat_communities rc
           WHERE rc.retreat_id = r.id
         ) AS total_communities,
         (
           SELECT COUNT(DISTINCT ra.person_id)
           FROM retreat_attendees ra
           WHERE ra.retreat_id = r.id AND ra.attended = TRUE
         ) AS total_personas,
         (
           SELECT COALESCE(SUM(rcg.total_debt), 0)
           FROM retreat_charges rcg
           WHERE rcg.retreat_id = r.id
         ) AS total_debt
       FROM retreats r
       WHERE r.status = 'finalizada'
       ORDER BY r.start_date DESC`,
    );

    const data = rows as RetreatHistory[];

    return {
      success: true,
      message: "Historial de convivencias obtenido con éxito",
      data,
    };
  } catch (error) {
    console.error("Error al obtener historial de convivencias:", error);
    return {
      success: false,
      message: "Error al obtener historial de convivencias",
      data: [] as RetreatHistory[],
    };
  }
};

export const updateRetreatInDB = async (input: {
  id: number;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  cost_per_person: number;
  is_leaders_only?: boolean;
  communities_ids: number[];
}) => {
  try {
    const { id, title, description, start_date, end_date, cost_per_person, is_leaders_only = false, communities_ids } = input;

    // Validar que el retreat existe
    const [existingRetreat] = await db.query(
      `SELECT id FROM retreats WHERE id = ?`,
      [id]
    );

    if ((existingRetreat as any[]).length === 0) {
      return {
        success: false,
        message: "La convivencia no existe",
      };
    }

    // Actualizar los datos básicos de la convivencia
    const queryUpdate = `
      UPDATE retreats
      SET title = ?, description = ?, start_date = ?, end_date = ?, cost_per_person = ?, is_leaders_only = ?, updated_at = NOW()
      WHERE id = ?
    `;
    await db.query(queryUpdate, [title, description, start_date, end_date, cost_per_person, is_leaders_only, id]);

    // Eliminar las asociaciones de comunidades anteriores
    await db.query(`DELETE FROM retreat_communities WHERE retreat_id = ?`, [id]);

    // Asociar las nuevas comunidades
    if (communities_ids.length > 0) {
      const communitiesValues = communities_ids.map(commId => [id, commId]);
      const placeholders = communitiesValues.map(() => '(?, ?)').join(', ');
      const queryAssociateCommunities = `
        INSERT INTO retreat_communities (retreat_id, community_id)
        VALUES ${placeholders}
      `;
      const flattenedValues = communitiesValues.flat();
      await db.query(queryAssociateCommunities, flattenedValues);
    }

    return {
      success: true,
      message: "Convivencia actualizada con éxito",
      data: id
    };
  } catch (error) {
    console.error("Error al actualizar convivencia:", error);
    return {
      success: false,
      message: "Error al actualizar la convivencia",
    };
  }
}
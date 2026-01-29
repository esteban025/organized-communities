import { db } from "@/lib/db";
import type { BrotherOutDB, BrotherwithRoles, BrotherwithRolesOutDB, SingleBrotherInput } from "@/types/brothers";

export const getBrohterByIdFromDB = async (id: number) => {
  const query = `
    SELECT 
      p.id,
      p.names,
      p.phone,
      p.community_id,
      p.civil_status,
      m.id as marriage_id,
      CASE 
        WHEN m.id IS NOT NULL THEN 
          CASE 
            WHEN m.person1_id = p.id THEN m.person2_id 
            ELSE m.person1_id 
          END
        ELSE NULL
      END as spouse_id,
      CASE 
        WHEN m.id IS NOT NULL THEN (
          SELECT names FROM persons 
          WHERE id = CASE 
            WHEN m.person1_id = p.id THEN m.person2_id 
            ELSE m.person1_id 
          END
        )
        ELSE NULL
      END as spouse_name,
      CASE 
        WHEN m.id IS NOT NULL THEN (
          SELECT phone FROM persons 
          WHERE id = CASE 
            WHEN m.person1_id = p.id THEN m.person2_id 
            ELSE m.person1_id 
          END
        )
        ELSE NULL
      END as spouse_phone,
      (
        SELECT JSON_ARRAYAGG(pr.role)
        FROM person_roles pr
        WHERE pr.person_id = p.id 
          AND pr.community_id = p.community_id 
          AND pr.role != 'catequista'
      ) as roles,
      (
        SELECT JSON_ARRAYAGG(pr.community_id)
        FROM person_roles pr
        WHERE pr.person_id = p.id 
          AND pr.role = 'catequista' 
          AND pr.community_id != p.community_id
      ) as catechist_communities
    FROM persons p
    LEFT JOIN marriages m ON (p.id = m.person1_id OR p.id = m.person2_id)
    WHERE p.id = ?
  `
  const [rows] = await db.query(query, [id]);
  const raw = rows as BrotherOutDB[];
  if (raw.length === 0) {
    return {
      success: false,
      message: "Hermano no encontrado",
      data: null,
    };
  }
  const data = raw[0];

  return {
    success: true,
    message: "Hermano recuperado correctamente",
    data
  };
}

export const getBrothersByCommunityIdFromDB = async (communityId: number) => {
  const query = `
    SELECT 
      CASE 
        WHEN m.id IS NOT NULL THEN CONCAT('m_', m.id)
        ELSE CONCAT('p_', p.id)
      END as group_id,
      p.id as person_id,
      m.id as marriage_id,
      CASE 
        WHEN m.id IS NOT NULL THEN m.person1_id
        ELSE NULL
      END as person1_id,
      CASE 
        WHEN m.id IS NOT NULL THEN m.person2_id
        ELSE NULL
      END as person2_id,
      CASE 
        WHEN m.id IS NOT NULL THEN CONCAT(
          (SELECT names FROM persons WHERE id = m.person1_id),
          ' y ',
          (SELECT names FROM persons WHERE id = m.person2_id)
        )
        ELSE p.names
      END as names,
      CASE 
        WHEN m.id IS NOT NULL THEN 'matrimonio'
        ELSE p.civil_status
      END as civil_status,
      GROUP_CONCAT(
        DISTINCT CASE 
          WHEN pr.role != 'catequista'
          THEN pr.role 
        END 
        ORDER BY pr.role 
        SEPARATOR ', '
      ) as roles
    FROM persons p
    LEFT JOIN marriages m ON (p.id = m.person1_id OR p.id = m.person2_id) AND m.community_id = p.community_id
    LEFT JOIN person_roles pr ON (pr.person_id = p.id OR pr.person_id = CASE WHEN p.id = m.person1_id THEN m.person2_id WHEN p.id = m.person2_id THEN m.person1_id END) 
      AND pr.community_id = p.community_id 
      AND pr.role != 'catequista'
    WHERE p.community_id = ?
      AND (m.id IS NULL OR p.id = m.person1_id)
    GROUP BY 
      m.id,
      p.id,
      p.names,
      p.civil_status
    ORDER BY 
      CASE WHEN m.id IS NOT NULL THEN 1 ELSE 2 END,
      names;
  `
  const [rows] = await db.query(query, [communityId]);
  const raw = rows as any[];

  const data: BrotherwithRolesOutDB[] = raw.map((row) => ({
    ...row,
    roles: row.roles
      ? (row.roles as string)
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean)
      : [],
  }));

  return {
    success: true,
    message: "Hermanos recuperados correctamente",
    data,
  };
}

export const getGroupLeadersByCommunityIdFromDB = async ({ community_id }: { community_id: number }) => {
  const query = `
    SELECT 
      p.id,
      p.names,
      p.phone,
      p.community_id as own_community_id,
      pr.role,
      CASE 
        WHEN pr.role = 'catequista' AND p.community_id != pr.community_id THEN 'catequista_externo'
        ELSE 'lider_interno'
      END as person_type
    FROM persons p
    INNER JOIN person_roles pr ON p.id = pr.person_id
    WHERE pr.community_id = ? -- ID de la comunidad que estamos consultando
      AND (
        -- Líderes de su propia comunidad (sin catequistas)
        (p.community_id = pr.community_id AND pr.role != 'catequista')
        OR
        -- Catequistas de otras comunidades
        (p.community_id != pr.community_id AND pr.role = 'catequista')
      )
    ORDER BY 
      CASE 
        WHEN pr.role = 'catequista' THEN 2 
        ELSE 1 
      END,
      p.names;
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

export const deleteBrotherInDB = async (ids: number[]) => {
  if (!ids || ids.length === 0) {
    return {
      success: false,
      message: "No se proporcionaron IDs para eliminar",
      data: null,
    };
  }

  const placeholders = ids.map(() => "?").join(", ");

  const deletePersonsQuery = `
    DELETE FROM persons
    WHERE id IN (${placeholders})
  `;
  const [result] = await db.query(deletePersonsQuery, ids);
  const ok = result as any;

  return {
    success: true,
    message: "Hermano(s) eliminado(s) correctamente",
    data: {
      affectedRows: ok?.affectedRows ?? 0,
    },
  };
};




type CreateMarriageInput = {
  id: number
  husband: { names: string; phone: string | null };
  wife: { names: string; phone: string | null };
  community_id: number;
  roles: string[];
  catechist_communities?: number[];
};

// Crea una persona soltera en persons y sus roles en person_roles
export const createSingleBrotherInDB = async (input: Omit<SingleBrotherInput, "id">) => {
  const { community_id, names, civil_status, phone, roles, catechist_communities } = input

  // verificamos que no el nombre no se repita en la misma comunidad
  const existingQuery = `
    SELECT id FROM persons WHERE names = ? AND community_id = ?
  `
  const [existingRows] = await db.query(existingQuery, [names, community_id])
  const existing = existingRows as any[]
  if (existing.length > 0) {
    return {
      success: false,
      message: "Ya existe un hermano con ese nombre en la comunidad",
      data: null,
    }
  }

  // que no exista un segundo responsable
  const queryChechLeader = `
    SELECT COUNT(*) as responsable_count FROM person_roles
    WHERE community_id = ? AND role = 'responsable'
  `
  const [leaderRows] = await db.query(queryChechLeader, [community_id])

  const leaderCount = (leaderRows as any[])[0].responsable_count as number
  if (roles.includes("responsable") && leaderCount >= 1) {
    return {
      success: false,
      message: "Ya existe un responsable en esta comunidad",
      data: null,
    }
  }

  const query = `
    INSERT INTO persons (names, civil_status, community_id, phone)
    VALUES (?, ?, ?, ?)
  `
  const [result] = await db.query(query, [names, civil_status, community_id, phone || null])

  // id del hermano recién creado
  const insertId = (result as any).insertId as number

  // verificamos si hay roles para asignar
  const roleValues: Array<[number, number, string]> = [];

  roles.forEach((role) => {
    if (!role) return;
    if (role === "catequista") {
      if (catechist_communities && catechist_communities.length > 0) {
        catechist_communities.forEach((cid) => {
          roleValues.push([insertId, cid, role]);
        });
      }
    } else {
      roleValues.push([insertId, community_id, role]);
    }
  });

  if (roleValues.length > 0) {
    const placeholders = roleValues.map(() => "(?, ?, ?)").join(", ");
    const insertRolesQuery = `
      INSERT INTO person_roles (person_id, community_id, role)
      VALUES ${placeholders}
    `;
    await db.query(insertRolesQuery, roleValues.flat());
  }

  return {
    success: true,
    message: "Hermano creado correctamente",
    data: { id: insertId, names },
  };

};

// Actualiza una persona soltera en persons y sus roles en person_roles
export const updateSingleBrotherInDB = async (input: SingleBrotherInput) => {
  const { id, names, civil_status, community_id, phone, roles, catechist_communities } = input;

  // Verificar que no exista otro hermano con el mismo nombre en la misma comunidad
  const existingQuery = `
    SELECT id FROM persons WHERE names = ? AND community_id = ? AND id != ?
  `;
  const [existingRows] = await db.query(existingQuery, [names, community_id, id]);
  const existing = existingRows as any[];
  if (existing.length > 0) {
    return {
      success: false,
      message: "Ya existe un hermano con ese nombre en la comunidad",
      data: null,
    };
  }

  // Verificar que no exista otro responsable distinto a este hermano
  const queryCheckLeader = `
    SELECT COUNT(*) as responsable_count FROM person_roles
    WHERE community_id = ? AND role = 'responsable' AND person_id != ?
  `;
  const [leaderRows] = await db.query(queryCheckLeader, [community_id, id]);
  const leaderCount = (leaderRows as any[])[0].responsable_count as number;
  if (roles.includes("responsable") && leaderCount >= 1) {
    return {
      success: false,
      message: "Ya existe un responsable en esta comunidad",
      data: null,
    };
  }

  // Actualizar datos básicos de la persona
  const updatePersonQuery = `
    UPDATE persons
    SET names = ?, civil_status = ?, community_id = ?, phone = ?
    WHERE id = ?
  `;
  await db.query(updatePersonQuery, [
    names,
    civil_status,
    community_id,
    phone || null,
    id,
  ]);

  // Eliminar roles actuales del hermano
  const deleteRolesQuery = `
    DELETE FROM person_roles WHERE person_id = ?
  `;
  await db.query(deleteRolesQuery, [id]);

  // Asignar nuevos roles
  const roleValues: Array<[number, number, string]> = [];

  roles.forEach((role) => {
    if (!role) return;
    if (role === "catequista") {
      if (catechist_communities && catechist_communities.length > 0) {
        catechist_communities.forEach((cid) => {
          roleValues.push([id, cid, role]);
        });
      }
    } else {
      roleValues.push([id, community_id, role]);
    }
  });

  if (roleValues.length > 0) {
    const placeholders = roleValues.map(() => "(?, ?, ?)").join(", ");
    const insertRolesQuery = `
      INSERT INTO person_roles (person_id, community_id, role)
      VALUES ${placeholders}
    `;
    await db.query(insertRolesQuery, roleValues.flat());
  }

  return {
    success: true,
    message: "Hermano actualizado correctamente",
    data: { id, names },
  };
};
// Crea dos personas en persons, un registro en marriages y roles en person_roles
export const createMarriageInDB = async (input: Omit<CreateMarriageInput, "id">) => {
  const { husband, wife, community_id, roles, catechist_communities } = input;

  // verificamos que no existn en la misma comunidad
  const existingQuery = `
    SELECT id, names FROM persons WHERE (names = ? OR names = ?) AND community_id = ?
  `
  const [existingRows] = await db.query(existingQuery, [husband.names, wife.names, community_id])
  const existing = existingRows as any[]
  if (existing.length > 0) {
    return {
      success: false,
      message: "Ya existe un hermano con ese nombre en la comunidad",
      data: null,
    }
  }

  // que no exista un segundo responsable
  const queryChechLeader = `
    SELECT COUNT(*) as responsable_count FROM person_roles
    WHERE community_id = ? AND role = 'responsable'
  `
  const [leaderRows] = await db.query(queryChechLeader, [community_id])
  const leaderCount = (leaderRows as any[])[0].responsable_count as number
  if (roles.includes("responsable") && leaderCount >= 1) {
    return {
      success: false,
      message: "Ya existe un responsable en esta comunidad",
      data: null,
    }
  }

  // creamos esposo y despues esposa

  const insertQuery = `
    INSERT INTO persons (names, civil_status, community_id, phone)
    VALUES (?, ?, ?, ?), (?, ?, ?, ?)
  `
  const [insertResult] = await db.query(insertQuery, [
    husband.names,
    "matrimonio",
    community_id,
    husband.phone || null,
    wife.names,
    "matrimonio",
    community_id,
    wife.phone || null,
  ])

  const insertId = (insertResult as any).insertId as number;
  const husbandId = insertId;
  const wifeId = insertId + 1;

  // relacionamos matrimonio en marriages
  const marriageQuery = `
    INSERT INTO marriages (person1_id, person2_id, community_id)
    VALUES (?, ?, ?)
  `
  await db.query(marriageQuery, [husbandId, wifeId, community_id])

  // asignamos roles a ambos
  const roleValues: Array<[number, number, string]> = [];
  roles.forEach((role) => {
    if (!role) return;
    if (role === "catequista") {
      if (catechist_communities && catechist_communities.length > 0) {
        catechist_communities.forEach((cid) => {
          roleValues.push([husbandId, cid, role]);
          roleValues.push([wifeId, cid, role]);
        });
      }
    } else {
      roleValues.push([husbandId, community_id, role]);
      roleValues.push([wifeId, community_id, role]);
    }
  });

  if (roleValues.length > 0) {
    const placeholders = roleValues.map(() => "(?, ?, ?)").join(", ");
    const insertRolesQuery = `
      INSERT INTO person_roles (person_id, community_id, role)
      VALUES ${placeholders}
    `;
    await db.query(insertRolesQuery, roleValues.flat());
  }

  return {
    success: true,
    message: "Hermanos agregados correctamente",
    data: { husbandId, wifeId },
  }

};

export const updateMarriageInDB = async (input: CreateMarriageInput) => {
  // aunque sea matrimonio voy a editar solamente a uno de los dos (name, phone), es lo unico que cambiara para ese id
  // el resto de informacion comparte para ambos, roles y catechist_communities

  const { id, husband, wife, community_id, roles, catechist_communities } = input;

  // perosona en cuestion
  const [marriage] = await db.query(
    `SELECT person1_id, person2_id FROM marriages 
       WHERE person1_id = ? OR person2_id = ?`,
    [id, id]
  );
  const marriageRows = marriage as any[];

  if (marriageRows.length === 0) {
    return {
      success: false,
      message: "No se encontró el matrimonio",
      data: null,
    };
  }

  const { person1_id, person2_id } = marriageRows[0];
  const spouseId = person1_id === id ? person2_id : person1_id;

  // Determinar qué datos usar según el ID
  const personData = person1_id === id ? husband : wife;


  // 1. Verficamos que no exista otro hermano con el mismo nombre en la misma comunidad segun el id, solamente del id que se esta porpocinando
  const existingQuery = `SELECT id FROM persons WHERE names = ? AND community_id = ? AND id != ?`;
  const [existingRowsHusband] = await db.query(existingQuery, [personData.names, community_id, id]);
  const existingHusband = existingRowsHusband as any[];

  if (existingHusband.length > 0) {
    return {
      success: false,
      message: "Ya existe un hermano con ese nombre en la comunidad",
      data: null,
    };
  }

  // 2. Si en el input.roles le llega que es responsable verificamos que no exista un responsable para esa comunidad
  if (roles && roles.includes('responsable')) {
    const queryCheckLeader = `
      SELECT person_id FROM person_roles
      WHERE community_id = ? AND role = 'responsable' AND person_id != ? AND person_id != ?
    `;
    const [leaderRows] = await db.query(queryCheckLeader, [community_id, person1_id, person2_id]);
    const leader = (leaderRows as any[]);
    if (leader.length >= 1) {
      return {
        success: false,
        message: "Ya existe un responsable en esta comunidad",
        data: null,
      };
    }
  }

  // 3. Actualizamos los datos de la persona con el id proporcionado (solo uno de los dos) y los roles princiaples o de catequistas asignamos a ambos
  const queryUpdatePerson = `
    UPDATE persons SET names = ?, phone = ?
    WHERE id = ?
  `
  await db.query(queryUpdatePerson, [personData.names, personData.phone || null, id])

  // eliminamos roles actuales de ambos
  const deleteRolesQuery = `
    DELETE FROM person_roles WHERE person_id = ? OR person_id = ?
  `
  await db.query(deleteRolesQuery, [id, spouseId])

  // asignar nuevos roles a ambos
  const roleValues: Array<[number, number, string]> = [];
  roles.forEach((role) => {
    if (!role) return;
    if (role === "catequista") {
      if (catechist_communities && catechist_communities.length > 0) {
        catechist_communities.forEach((cid) => {
          roleValues.push([id, cid, role]);
          roleValues.push([spouseId, cid, role]);
        });
      }
    } else {
      roleValues.push([id, community_id, role]);
      roleValues.push([spouseId, community_id, role]);
    }
  });

  if (roleValues.length > 0) {
    const placeholders = roleValues.map(() => "(?, ?, ?)").join(", ");
    const insertRolesQuery = `
      INSERT INTO person_roles (person_id, community_id, role)
      VALUES ${placeholders}
    `;
    await db.query(insertRolesQuery, roleValues.flat());
  }

  return {
    success: true,
    message: "Matrimonio actualizado correctamente",
    data: null,
  }
}



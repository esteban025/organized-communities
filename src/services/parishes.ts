import { db } from "@/lib/db";
import type { Parish, ParishWithCounts } from "@/types/parishes";


export const getParishByIdFromDB = async (id: number) => {
  const query = `
    SELECT id, name, tag, aka
    FROM parishes
    WHERE id = ?;
  `;
  const [rows] = await db.query(query, [id]);
  const data = rows as Parish[];
  return {
    success: true,
    message: "Parroquia obtenida correctamente",
    data: data[0],
  }
}

export const getParishesFromDB = async () => {
  const query = `
    SELECT 
      p.id,
      p.name,
      p.tag,
      p.aka,
      COUNT(c.id) as count_communities
    FROM parishes p
    LEFT JOIN communities c ON p.id = c.parish_id
    GROUP BY p.id, p.name, p.tag, p.aka
    ORDER BY p.id ASC;
  `;
  const [rows] = await db.query(query);
  const data = rows as ParishWithCounts[];
  return {
    success: true,
    message: "Parroquias obtenidas correctamente",
    data,
  }
}

export const createParishInDB = async (data: Omit<Parish, "id">) => {
  const { name, tag, aka } = data

  // verificar que no exista una parroquia con el mismo nombre, tag o aka
  const checkQuery = `SELECT * FROM parishes WHERE name = ? OR tag = ? OR aka = ?`;
  const [existingRows] = await db.query(checkQuery, [name, tag, aka]);
  const existingParishes = existingRows as Parish[];
  if (existingParishes.length > 0) {
    return {
      success: false,
      message: "Ya existe una parroquia con el mismo nombre, tag o aka",
    }
  }

  // si no existe, creamos
  const query = `INSERT INTO parishes (name, tag, aka) VALUES (?, ?, ?)`;
  await db.query(query, [name, tag, aka]);
  return {
    success: true,
    message: "Parroquia creada correctamente",
    data,
  }
}

export const updateParishInDB = async (data: Parish) => {
  const { id, name, tag, aka } = data

  // verificamos que no exista otra parroquia con el mismo nombre, tag o aka
  const checkQuery = `SELECT * FROM parishes WHERE (name = ? OR tag = ? OR aka = ?) AND id != ?`;
  const [existingRows] = await db.query(checkQuery, [name, tag, aka, id]);
  const existingParishes = existingRows as Parish[];

  if (existingParishes.length > 0) {
    return {
      success: false,
      message: "Ya existe otra parroquia con el mismo nombre, tag o aka",
    }
  }

  const query = `UPDATE parishes SET name = ?, tag = ?, aka = ? WHERE id = ?`;
  await db.query(query, [name, tag, aka, id]);
  return {
    success: true,
    message: "Parroquia actualizada correctamente",
    data,
  }
}

export const deleteParishFromDB = async (id: number) => {
  const query = `DELETE FROM parishes WHERE id = ?`;
  await db.query(query, [id]);
  return {
    success: true,
    message: "Parroquia eliminada correctamente",
  }
}
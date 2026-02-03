import { db } from "@/lib/db"
import type { RetreatHouse } from "@/types/retreatHouses"

export const getRetreatHousesFromDB = async () => {
  const query = `
    SELECT id, name, address, max_capacity, description
    FROM retreat_houses
    ORDER BY name ASC
  `
  const [rows] = await db.query(query)
  const retreatHouses: RetreatHouse[] = (rows as any[]).map((row) => ({
    id: row.id,
    name: row.name,
    address: row.address,
    max_capacity: row.max_capacity,
    description: row.description,
  }))
  return {
    success: true,
    message: "Casas de retiro obtenidas exitosamente",
    data: retreatHouses,
  }
}

export const createRetreatHouseInDB = async (input: Omit<RetreatHouse, "id">) => {
  const { name, address, max_capacity, description } = input
  const query = `
    INSERT INTO retreat_houses (name, address, max_capacity, description)
    VALUES (?, ?, ?, ?)
  `
  const params = [name, address, max_capacity, description]
  const [result] = await db.query(query, params)

  const insertId = (result as any).insertId as number
  const newRetreatHouse: RetreatHouse = {
    id: insertId,
    name,
    address,
    max_capacity,
    description,
  }
  return {
    success: true,
    message: "Casa de retiro creada exitosamente",
    data: newRetreatHouse,
  }

}
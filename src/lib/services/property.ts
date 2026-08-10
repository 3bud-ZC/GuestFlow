import { db } from "@/lib/db";
import { PropertyInput, PropertySchema } from "../validation/property";

export const propertyService = {
  async getProperties() {
    const properties = await db.property.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        _count: {
          select: { rooms: true },
        },
        rooms: {
          where: { airbnbIcalUrl: { not: null } },
          select: { id: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return properties.map((p) => ({
      id: p.id,
      name: p.name,
      address: p.address,
      _count: p._count,
      airbnbConnectedCount: p.rooms.length,
    }));
  },

  async getPropertiesForSelector() {
    return db.property.findMany({
      select: {
        id: true,
        name: true,
        rooms: {
          select: {
            id: true,
            name: true,
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });
  },

  async getPropertyById(id: string) {
    return db.property.findUnique({
      where: { id },
      include: { rooms: true },
    });
  },

  async createProperty(data: PropertyInput) {
    const validData = PropertySchema.parse(data);
    return db.property.create({ data: validData });
  },

  async updateProperty(id: string, data: PropertyInput) {
    const validData = PropertySchema.parse(data);
    return db.property.update({
      where: { id },
      data: validData,
    });
  },
};

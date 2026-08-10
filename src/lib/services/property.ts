import { db } from "@/lib/db";
import { PropertyInput, PropertySchema } from "../validation/property";

export const propertyService = {
  async getProperties() {
    return db.property.findMany({
      include: {
        _count: {
          select: { rooms: true },
        },
        rooms: {
          select: { airbnbIcalUrl: true }
        }
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

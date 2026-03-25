import type {
  User,
  ParkingSpot,
  SpotAvailability,
  Reservation,
  Dispute,
  ActivityLog,
  Notification,
  Invite,
  Role,
} from "@prisma/client";

// Re-export Prisma types
export type {
  User,
  ParkingSpot,
  SpotAvailability,
  Reservation,
  Dispute,
  ActivityLog,
  Notification,
  Invite,
  Role,
};

// API response envelope
export interface ApiResponse<T> {
  data: T;
  meta?: { total: number; page: number; pageSize: number };
}

export interface ApiError {
  error: { code: string; message: string; details?: unknown };
}

// Extended types with relations
export type SpotWithOwner = ParkingSpot & {
  owner: Pick<User, "id" | "name" | "email" | "unitNumber"> | null;
};

export type AvailabilityWithSpot = SpotAvailability & {
  spot: SpotWithOwner;
  reservations: ReservationWithUser[];
};

export type ReservationWithDetails = Reservation & {
  availability: SpotAvailability & {
    spot: SpotWithOwner;
  };
  reservedBy: Pick<User, "id" | "name" | "email" | "unitNumber">;
};

export type ReservationWithUser = Reservation & {
  reservedBy: Pick<User, "id" | "name" | "email">;
};

// NextAuth session extension
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
      image?: string | null;
    };
  }
}

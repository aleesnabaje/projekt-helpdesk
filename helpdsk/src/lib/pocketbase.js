import PocketBase from "pocketbase";

// Adres bierzemy ze zmiennej srodowiskowej, nie wpisujemy go na sztywno
export const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

// Zeby React w trybie dev nie anulowal zapytan
pb.autoCancellation(false);

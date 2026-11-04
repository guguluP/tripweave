import { answerAsk, needsLocalConditions, type AskReply } from "@/lib/ask-model";
import { groundingPacket } from "@/lib/arrival-ask";
import { isCountryCode } from "@/lib/countries";
import { getPackage } from "@/lib/packages";
import { stayPin } from "@/lib/places";
import { findOwnBookingByCode } from "@/lib/server/booking-lookup";
import { puriBulletin } from "@/lib/server/local-conditions";
import { roadLegs } from "@/lib/server/road-route";
import { isVisitQuestion, visitTargets } from "@/lib/visit-places";

export type AskReplyInput = {
  question: string;
  nationalities?: string[];
  oci?: boolean[];
  priorIndianVisa?: boolean[];
  arrivalAirport?: string;
  checkIn?: string;
  packageId?: string;
  roomId?: string;
  nights?: number;
  arriveBy?: "fly" | "train" | "bus" | "road";
  confirmationCode?: string;
  history?: { question: string; answer: string }[];
  userId: string;
};

/** Owned facts, one booking row, and the Puri bulletin only when the question asks for it. */
export async function replyToAsk(input: AskReplyInput): Promise<AskReply> {
  const nationalities = (input.nationalities ?? []).filter((code) => isCountryCode(code));
  let packageId = input.packageId;
  let roomId = input.roomId;
  let checkIn = input.checkIn;
  let nights = input.nights;
  let amountInr: number | null = null;
  let status: string | null = null;
  if (input.confirmationCode) {
    const own = await findOwnBookingByCode(input.userId, input.confirmationCode);
    if (own) {
      packageId = own.packageId;
      roomId = own.roomId || roomId;
      checkIn = own.checkIn;
      nights = own.nights;
      amountInr = own.amountInr;
      status = own.status;
    }
  }
  const packet = groundingPacket({
    nationalities,
    oci: input.oci,
    priorIndianVisa: input.priorIndianVisa,
    arrivalAirport: input.arrivalAirport,
    checkIn,
    packageId,
    roomId,
    nights,
    arriveBy: input.arriveBy,
    amountInr,
    status,
  });
  const bulletin = needsLocalConditions(input.question) ? await puriBulletin() : null;
  const named = packageId ? getPackage(packageId) : undefined;
  const from = packageId ? stayPin(packageId, named?.name ?? packageId) : null;
  const roads =
    from && isVisitQuestion(input.question) ? await roadLegs(from, visitTargets(input.question)) : [];
  return answerAsk(input.question, packet, {
    history: input.history,
    arriveBy: input.arriveBy,
    bulletin,
    from,
    roads,
  });
}

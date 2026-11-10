import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Choice } from "@/components/plan-city-menu";
import { RequireAuth } from "@/components/require-auth";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { parseGroupBrief } from "@/lib/group/parse-brief";
import { pageHead } from "@/lib/page-title";
import { createGroupTrip } from "@/lib/server/group-trips";

export const Route = createFileRoute("/group/new")({
  component: NewGroup,
  head: () => pageHead("Plan for the family"),
});

function NewGroup() {
  return (
    <RequireAuth next="/group/new" fallback={<Shell><p className="p-8">Checking sign-in…</p></Shell>}>
      <Form />
    </RequireAuth>
  );
}

function Form() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("Puri darshan");
  const [dateMode, setDateMode] = useState<"dates" | "rath_yatra">("dates");
  const [checkIn, setCheckIn] = useState("");
  const [nights, setNights] = useState(3);
  const [adults, setAdults] = useState(4);
  const [children, setChildren] = useState(0);
  const [elderly, setElderly] = useState(0);
  const [budget, setBudget] = useState("");
  const [darshan, setDarshan] = useState(true);
  const [konark, setKonark] = useState(false);
  const [beach, setBeach] = useState(false);
  const [gundicha, setGundicha] = useState(false);
  const [wheelchair, setWheelchair] = useState(false);
  const [ground, setGround] = useState(false);
  const [lift, setLift] = useState(false);
  const [voteClose, setVoteClose] = useState("");
  const [name, setName] = useState("");
  const [sentence, setSentence] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <Shell>
      <form
        className="mx-auto grid max-w-xl gap-4 px-4 py-10"
        onSubmit={(event) => {
          event.preventDefault();
          setBusy(true);
          const interests = [
            darshan ? "darshan" : null,
            gundicha ? "gundicha" : null,
            konark ? "konark" : null,
            beach ? "beach" : null,
          ].filter((item): item is "darshan" | "gundicha" | "konark" | "beach" => Boolean(item));
          const needs = [
            wheelchair ? "wheelchair" : null,
            ground ? "ground_floor" : null,
            lift ? "lift" : null,
          ].filter((item): item is "wheelchair" | "ground_floor" | "lift" => Boolean(item));
          void createGroupTrip({
            data: {
              title,
              dateMode,
              checkIn: dateMode === "dates" ? checkIn : undefined,
              nights: dateMode === "dates" ? nights : undefined,
              adults,
              children,
              elderly,
              budgetPerHeadInr: budget ? Number(budget) : null,
              needs,
              interests,
              voteClosesAt: new Date(voteClose).toISOString(),
              organiserName: name,
            },
          }).then((res) => {
            setBusy(false);
            if (!res.ok) {
              setMessage(res.message);
              return;
            }
            void navigate({ to: "/g/$token", params: { token: res.token } });
          });
        }}
      >
        <p className="eyebrow">Family trip</p>
        <h1 className="font-display text-4xl">Plan for the family</h1>
        <label className="grid gap-1 text-sm">Describe it
          <textarea
            className="min-h-20 rounded-md border border-border bg-bg px-3 py-2"
            value={sentence}
            placeholder="13 people, 3 grandparents, darshan + Konark, June, ₹3,000 per head"
            onChange={(e) => {
              const text = e.target.value;
              setSentence(text);
              const parsed = parseGroupBrief(text);
              if (parsed.adults) setAdults(parsed.adults);
              if (parsed.children != null) setChildren(parsed.children);
              if (parsed.elderly != null) setElderly(parsed.elderly);
              if (parsed.budgetPerHeadInr) setBudget(String(parsed.budgetPerHeadInr));
              if (parsed.checkIn) setCheckIn(parsed.checkIn);
              if (parsed.nights) setNights(parsed.nights);
              if (parsed.dateMode) setDateMode(parsed.dateMode);
              setDarshan(parsed.interests.includes("darshan"));
              setKonark(parsed.interests.includes("konark"));
              setBeach(parsed.interests.includes("beach"));
              setGundicha(parsed.interests.includes("gundicha"));
              setWheelchair(parsed.needs.includes("wheelchair"));
              setGround(parsed.needs.includes("ground_floor"));
              setLift(parsed.needs.includes("lift"));
            }}
          />
        </label>
        <label className="grid gap-1 text-sm">Your name<input className="min-h-11 rounded-md border border-border bg-bg px-3" value={name} onChange={(e) => setName(e.target.value)} required /></label>
        <label className="grid gap-1 text-sm">Title<input className="min-h-11 rounded-md border border-border bg-bg px-3" value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
        <label className="grid gap-1 text-sm">Dates
          <select className="min-h-11 rounded-md border border-border bg-bg px-3" value={dateMode} onChange={(e) => setDateMode(e.target.value as "dates" | "rath_yatra")}>
            <option value="dates">Chosen dates</option>
            <option value="rath_yatra">Rath Yatra</option>
          </select>
        </label>
        {dateMode === "dates" ? (
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">Check-in<input className="min-h-11 rounded-md border border-border bg-bg px-3" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required /></label>
            <label className="grid gap-1 text-sm">Nights<input className="min-h-11 rounded-md border border-border bg-bg px-3" type="number" min={1} max={14} value={nights} onChange={(e) => setNights(Number(e.target.value))} required /></label>
          </div>
        ) : null}
        <div className="grid grid-cols-3 gap-3">
          <label className="grid gap-1 text-sm">Adults<input className="min-h-11 rounded-md border border-border bg-bg px-3" type="number" min={1} value={adults} onChange={(e) => setAdults(Number(e.target.value))} required /></label>
          <label className="grid gap-1 text-sm">Children<input className="min-h-11 rounded-md border border-border bg-bg px-3" type="number" min={0} value={children} onChange={(e) => setChildren(Number(e.target.value))} /></label>
          <label className="grid gap-1 text-sm">Elderly<input className="min-h-11 rounded-md border border-border bg-bg px-3" type="number" min={0} value={elderly} onChange={(e) => setElderly(Number(e.target.value))} /></label>
        </div>
        <label className="grid gap-1 text-sm">Budget per person, optional<input className="min-h-11 rounded-md border border-border bg-bg px-3" inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value)} /></label>
        <fieldset>
          <legend className="text-sm font-medium">Interests</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Choice selected={darshan} title="Darshan" onClick={() => setDarshan((on) => !on)} />
            <Choice selected={gundicha} title="Gundicha" onClick={() => setGundicha((on) => !on)} />
            <Choice selected={konark} title="Konark" onClick={() => setKonark((on) => !on)} />
            <Choice selected={beach} title="Beach" onClick={() => setBeach((on) => !on)} />
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-medium">Needs</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Choice selected={wheelchair} title="Wheelchair" onClick={() => setWheelchair((on) => !on)} />
            <Choice selected={ground} title="Ground floor" onClick={() => setGround((on) => !on)} />
            <Choice selected={lift} title="Lift" onClick={() => setLift((on) => !on)} />
          </div>
        </fieldset>
        <label className="grid gap-1 text-sm">Voting closes
          <input className="min-h-11 rounded-md border border-border bg-bg px-3" type="datetime-local" value={voteClose} onChange={(e) => setVoteClose(e.target.value)} required />
        </label>
        {message ? <p className="text-sm">{message}</p> : null}
        <Button type="submit" disabled={busy}>Create the link</Button>
      </form>
    </Shell>
  );
}

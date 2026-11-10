import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Choice } from "@/components/plan-city-menu";
import { RequireAuth } from "@/components/require-auth";
import { Shell } from "@/components/shell";
import { CheckInField } from "@/components/stay-quote";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DigitPop } from "@/components/motion";
import { addDays, todayIso } from "@/lib/inventory";
import { parseGroupBrief } from "@/lib/group/parse-brief";
import { pageHead } from "@/lib/page-title";
import { createGroupTrip } from "@/lib/server/group-trips";

function CountStepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <div className="mt-2 flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label={`Fewer ${label.toLowerCase()}`}
          disabled={value <= min}
        >
          −
        </Button>
        <span className="min-w-10 text-center font-display text-2xl tabular-nums">
          <DigitPop value={value} />
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onChange(Math.min(max, value + 1))}
          aria-label={`More ${label.toLowerCase()}`}
          disabled={value >= max}
        >
          +
        </Button>
      </div>
    </div>
  );
}

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
  const today = todayIso();
  const [checkIn, setCheckIn] = useState(today);
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
  const [voteDay, setVoteDay] = useState(addDays(today, 3));
  const [voteHour, setVoteHour] = useState(18);
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
              voteClosesAt: new Date(
                `${voteDay}T${String(voteHour).padStart(2, "0")}:00:00+05:30`,
              ).toISOString(),
              organiserName: name,
            },
          })
            .then((res) => {
              setBusy(false);
              if (!res.ok) {
                setMessage(res.message);
                return;
              }
              void navigate({ to: "/g/$token", params: { token: res.token } });
            })
            .catch(() => {
              setBusy(false);
              setMessage("The link could not be created. Try again.");
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
        <label className="grid gap-1 text-sm font-medium">Your name
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="grid gap-1 text-sm font-medium">Title
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <fieldset>
          <legend className="text-sm font-medium">Dates</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Choice selected={dateMode === "dates"} title="Chosen dates" onClick={() => setDateMode("dates")} />
            <Choice selected={dateMode === "rath_yatra"} title="Rath Yatra" onClick={() => setDateMode("rath_yatra")} />
          </div>
        </fieldset>
        {dateMode === "dates" ? (
          <div className="grid gap-6">
            <CheckInField checkIn={checkIn} minDate={today} onCheckIn={setCheckIn} />
            <CountStepper label="Nights" value={nights} min={1} max={14} onChange={setNights} />
          </div>
        ) : null}
        <fieldset>
          <legend className="text-sm font-medium">Who's going</legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <CountStepper
              label="Adults"
              value={adults}
              min={1}
              max={30}
              onChange={(n) => {
                setAdults(n);
                setElderly((elders) => Math.min(elders, n));
              }}
            />
            <CountStepper label="Children" value={children} min={0} max={20} onChange={setChildren} />
            <CountStepper label="Elderly" value={elderly} min={0} max={adults} onChange={setElderly} />
          </div>
        </fieldset>
        <label className="grid gap-1 text-sm font-medium">Budget per person, optional
          <Input inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value.replace(/[^\d]/g, ""))} />
        </label>
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
        <div className="grid gap-6">
          <CheckInField
            label="Voting closes"
            checkIn={voteDay}
            minDate={today}
            onCheckIn={setVoteDay}
            hint="India time. The hour is below."
          />
          <CountStepper label="Hour" value={voteHour} min={0} max={23} onChange={setVoteHour} />
        </div>
        {message ? <p className="text-sm">{message}</p> : null}
        <Button type="submit" disabled={busy}>Create the link</Button>
      </form>
    </Shell>
  );
}

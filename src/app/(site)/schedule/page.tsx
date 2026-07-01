import type { Metadata } from "next";
import PageHeader from "@/components/page-header";

export const metadata: Metadata = {
  title: "Schedule · OWASP CTF @ DEF CON 34",
  description: "Event schedule for the OWASP CTF at DEF CON 34, August 6–9, 2026.",
};

const schedule: { day: string; date: string; items: { time: string; label: string; note?: string }[] }[] = [
  {
    day: "Thursday",
    date: "Aug 6",
    items: [
      { time: "10:00", label: "Registration opens", note: "Set up your team on the scoreboard" },
      { time: "12:00", label: "CTF goes live", note: "First flags can be submitted" },
      { time: "18:00", label: "Beginner walkthrough", note: "Optional intro session for first-timers" },
    ],
  },
  {
    day: "Friday",
    date: "Aug 7",
    items: [
      { time: "10:00", label: "New challenges drop" },
      { time: "15:00", label: "Mid-event standings recap" },
    ],
  },
  {
    day: "Saturday",
    date: "Aug 8",
    items: [
      { time: "10:00", label: "Final challenge wave" },
      { time: "20:00", label: "Scoreboard freeze", note: "Rankings hidden for the final stretch" },
    ],
  },
  {
    day: "Sunday",
    date: "Aug 9",
    items: [
      { time: "12:00", label: "CTF closes", note: "Last flag submission accepted" },
      { time: "14:00", label: "Winners announced", note: "Top teams must be present to claim prizes" },
    ],
  },
];

export default function SchedulePage() {
  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Timeline"
        title="Schedule"
        description="All times are local to Las Vegas (PDT). The competition runs continuously from launch to close — sleep is optional."
      />

      <div className="flex flex-col gap-8">
        {schedule.map((day) => (
          <section key={day.date} className="flex flex-col gap-4 sm:flex-row sm:gap-8">
            <div className="flex-none sm:w-32">
              <p className="text-lg font-semibold text-white">{day.day}</p>
              <p className="font-mono text-sm text-[#14b8a6]">{day.date}</p>
            </div>
            <ol className="flex flex-1 flex-col gap-3 border-l border-white/[0.08] pl-6">
              {day.items.map((item, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[1.65rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[#2563eb] bg-[#1a1a2e]" />
                  <div className="rounded-lg border border-white/[0.06] bg-[#16162a] px-4 py-3">
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-sm tabular-nums text-zinc-500">{item.time}</span>
                      <span className="font-medium text-white">{item.label}</span>
                    </div>
                    {item.note && <p className="mt-1 text-sm text-zinc-400">{item.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}

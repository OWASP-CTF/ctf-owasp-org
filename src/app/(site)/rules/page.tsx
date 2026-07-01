import type { Metadata } from "next";
import PageHeader from "@/components/page-header";

export const metadata: Metadata = {
  title: "Rules · OWASP CTF @ DEF CON 34",
  description: "Competition rules and code of conduct for the OWASP CTF at DEF CON 34.",
};

const sections: { heading: string; rules: string[] }[] = [
  {
    heading: "Teams",
    rules: [
      "Teams may have 1 to 4 members. Solo players are welcome.",
      "Each person competes on exactly one team. No switching teams mid-event.",
      "Register your team on the scoreboard before submitting your first flag.",
    ],
  },
  {
    heading: "Fair play",
    rules: [
      "Do not attack the scoreboard, competition infrastructure, or other teams' machines. Only the challenge targets are in scope.",
      "Do not share flags, solutions, or hints with other teams during the competition.",
      "Do not brute-force flag submissions. Excessive automated guessing will be rate-limited or disqualified.",
      "Automated scanning of out-of-scope hosts is prohibited.",
    ],
  },
  {
    heading: "Conduct",
    rules: [
      "The DEF CON Code of Conduct applies at all times. Harassment of any kind ends your event.",
      "Be excellent to the volunteers, organizers, and your fellow competitors.",
      "Found a bug in a challenge or the platform? Report it to an organizer — don't exploit it for an unfair edge.",
    ],
  },
  {
    heading: "Scoring & prizes",
    rules: [
      "Challenges use dynamic scoring; point values fall as more teams solve them.",
      "Ties are broken by the timestamp the score was reached — earlier wins.",
      "Prizes are awarded to the top three teams overall, plus category standouts. Winners must be present to claim.",
      "Organizer decisions on scoring disputes are final.",
    ],
  },
];

export default function RulesPage() {
  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="The Fine Print"
        title="Rules & Code of Conduct"
        description="Keep the competition fair and the community welcoming. Breaking these can cost points or your spot in the event."
      />

      <div className="flex flex-col gap-6">
        {sections.map((section) => (
          <section
            key={section.heading}
            className="rounded-lg border border-white/[0.06] bg-[#16162a] p-6"
          >
            <h2 className="mb-4 text-lg font-semibold text-white">{section.heading}</h2>
            <ul className="flex flex-col gap-3">
              {section.rules.map((rule, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-zinc-400">
                  <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#2563eb]" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

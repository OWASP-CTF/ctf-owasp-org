import type { Metadata } from "next";
import PageHeader from "@/components/page-header";

export const metadata: Metadata = {
  title: "Rules · OWASP CTF @ DEF CON 34",
  description: "Competition rules and code of conduct for the OWASP secure development CTF at DEF CON 34.",
};

const sections: { heading: string; rules: string[] }[] = [
  {
    heading: "Teams",
    rules: [
      "You can compete solo or as a team of up to four. Teams are optional, and you can join or create one from your profile after signing in with GitHub.",
      "Each person belongs to at most one team at a time.",
      "Your GitHub login is your identity for scoring. Submit every pull request from the account you signed in with.",
    ],
  },
  {
    heading: "Fair play",
    rules: [
      "Only the six challenge targets (Juice Shop, DVWA, WebGoat, Security Shepherd, VulnerableApp, VAmPI) are in scope. Do not attack the CI scoring pipeline, the leaderboard, or other contestants' forks.",
      "Submit your own work. Don't publish full solutions or patches for others to copy during the event.",
      "Automated mass-submission or spamming pull requests to farm scoring runs will get your account rate-limited or disqualified.",
      "Using AI tools to help find and patch vulnerabilities is encouraged. It's part of the intended workflow, not a shortcut against the rules.",
    ],
  },
  {
    heading: "Conduct",
    rules: [
      "The DEF CON Code of Conduct applies at all times. Harassment of any kind ends your event.",
      "Be excellent to the volunteers, organizers, and your fellow competitors.",
      "Found a bug in a challenge, the scorer, or the site itself? Report it to an organizer instead of exploiting it for an unfair edge.",
    ],
  },
  {
    heading: "Scoring & prizes",
    rules: [
      "Each challenge is worth a fixed point value based on difficulty. Points post the moment your PR's regression test passes.",
      "Your best-ever result per challenge counts. A later successful patch always replaces an earlier miss.",
      "Prizes are awarded to the top individuals and top teams overall. Winners must be present to claim.",
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

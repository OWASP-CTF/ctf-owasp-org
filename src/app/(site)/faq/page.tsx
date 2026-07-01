import type { Metadata } from "next";
import PageHeader from "@/components/page-header";
import FaqAccordion, { type QA } from "@/components/faq-accordion";

export const metadata: Metadata = {
  title: "FAQ · OWASP CTF @ DEF CON 34",
  description: "Frequently asked questions about the OWASP CTF at DEF CON 34.",
};

const faqs: QA[] = [
  {
    q: "Do I need experience to compete?",
    a: "No. Challenges range from beginner to advanced, and the beginner tier is designed to be solvable with no prior CTF experience. Start there and work up.",
  },
  {
    q: "Can I compete solo?",
    a: "Yes. Teams can be 1 to 4 people. Plenty of competitors play solo — you'll just be on a team of one.",
  },
  {
    q: "Do I need to be at DEF CON in person?",
    a: "Yes. This is an in-person competition at the Las Vegas Convention Center and requires a valid DEF CON 34 badge.",
  },
  {
    q: "What do I need to bring?",
    a: "Your own laptop with the tools you like to work in. Bring a charger and a power strip — outlets go fast. The challenge environment is accessed over the network on-site.",
  },
  {
    q: "What does a flag look like?",
    a: "Flags follow the format OWASP{...}. Submit them exactly as found, including the wrapper. They're case-sensitive.",
  },
  {
    q: "How are ties broken?",
    a: "By time. If two teams have the same score, the team that reached that score first ranks higher — so fast solves matter.",
  },
  {
    q: "Is there a prize?",
    a: "Yes — prizes go to the top three teams overall plus category standouts. You must be present at the closing ceremony to claim.",
  },
];

export default function FaqPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Questions"
        title="FAQ"
        description="Quick answers to the things contestants ask most. Still stuck? Find an organizer at the OWASP CTF area."
      />
      <FaqAccordion items={faqs} />
    </div>
  );
}

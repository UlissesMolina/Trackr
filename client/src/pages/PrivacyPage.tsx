import { Link } from "react-router-dom";

const UPDATED = "November 13, 2026";
const ISSUES_URL = "https://github.com/UlissesMolina/Trackr/issues";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-semibold text-text-primary">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-text-secondary">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Link to="/" className="text-sm text-text-tertiary hover:text-text-secondary">
          ← Trackr
        </Link>
        <h1 className="mt-6 font-display text-4xl font-semibold text-text-primary">Privacy Policy</h1>
        <p className="mt-2 text-sm text-text-tertiary">Last updated {UPDATED}</p>

        <p className="mt-8 text-[15px] leading-relaxed text-text-secondary">
          Trackr is a personal job-application tracker. This page explains what data it keeps, why, who else
          handles it, and how to remove it. Trackr does not sell your data or use it for advertising.
        </p>

        <Section title="What Trackr stores">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-text-primary">Your account</strong>: sign-in is handled by Clerk, which stores
              your name, email address and login details.
            </li>
            <li>
              <strong className="text-text-primary">What you add</strong>: applications (company, title, location,
              salary, links, dates, status and its history), notes, interviews, online assessments, tags, your
              resume text and generated cover letters.
            </li>
            <li>
              <strong className="text-text-primary">Browser extension</strong>: when you save a job, the extension
              sends the posting&apos;s title, company, location, link and description to your Trackr account. It stores
              a sign-in token in your browser and reads a page only when you ask it to save that page.
            </li>
          </ul>
        </Section>

        <Section title="Gmail sync (optional)">
          <p>
            If you connect Gmail, Trackr requests read-only access (<code className="text-[13px]">gmail.readonly</code>
            ). It cannot send, delete, label or change any email.
          </p>
          <p>
            Trackr searches recent mail for messages that look related to job applications, such as confirmations,
            interview or assessment invitations, offers and rejections. For those messages only, it reads the
            sender, subject, date and the beginning of the body, and uses them to update the matching application
            in your Trackr account.
          </p>
          <p>
            Trackr keeps a short record of each message it examined (sender, subject, date, the detected
            company, title and outcome) so it never processes the same email twice and so you can see what it
            changed. It does not store email bodies. Your Google access token is stored encrypted.
          </p>
          <p>
            Disconnecting Gmail in Settings revokes Trackr&apos;s access with Google and deletes the stored token and
            the email record. You can also revoke access at any time from{" "}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              your Google Account permissions
            </a>
            .
          </p>
          <p className="rounded-lg border border-border-default bg-surface-secondary p-4">
            Trackr&apos;s use and transfer of information received from Google APIs adheres to the{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements. Gmail data is used only to keep your applications up to
            date. It is not used for advertising, not sold, not used to train AI models, and not read by people
            except when you ask for help with a specific problem or the law requires it.
          </p>
        </Section>

        <Section title="Services that process your data">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-text-primary">Clerk</strong>: accounts and sign-in.
            </li>
            <li>
              <strong className="text-text-primary">Railway</strong>: hosts the server and database where your
              Trackr data lives.
            </li>
            <li>
              <strong className="text-text-primary">Netlify</strong>: hosts the website.
            </li>
            <li>
              <strong className="text-text-primary">OpenAI</strong>: when you use an AI feature (cover letters,
              importing from a pasted email) or Gmail sync, the relevant text is sent to OpenAI&apos;s API to
              generate or classify it. OpenAI&apos;s API terms state that this data is not used to train their models.
            </li>
            <li>
              <strong className="text-text-primary">Google</strong>: only if you connect Gmail, as described above.
            </li>
          </ul>
        </Section>

        <Section title="Deleting your data">
          <p>
            In Settings you can disconnect Gmail, export your applications as CSV, or delete all of your
            applications along with their notes, interviews and history. To delete everything, including your
            account, open an issue on{" "}
            <a href={ISSUES_URL} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              GitHub
            </a>{" "}
            and it will be removed.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about this policy can be raised on{" "}
            <a href={ISSUES_URL} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              GitHub
            </a>
            . If this policy changes, the date at the top of this page will be updated.
          </p>
        </Section>
      </div>
    </div>
  );
}

import openai from "../lib/openai";
import { parseMatchAnalysis, InvalidMatchAnalysisError, type MatchAnalysis } from "../lib/matchAnalysis";

interface ExtractedApplication {
  title: string;
  company: string;
  location?: string;
  url?: string;
  dateApplied?: string;
  status?: string;
}

export async function extractFromEmails(
  emailText: string
): Promise<ExtractedApplication[]> {
  const systemPrompt = `You extract job application details from email text. The user will paste one or more "thank you for applying" or "application received" confirmation emails.

For each distinct application found, extract:
- title: the job title/position
- company: the company name
- location: city/state/remote if mentioned
- url: any application or job posting link
- dateApplied: the date the email was sent or application was submitted (ISO format YYYY-MM-DD)
- status: always "APPLIED"

Return a JSON array of objects. If you cannot determine a required field (title or company), make your best guess from context. Only return the JSON array, no other text.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: emailText },
    ],
    temperature: 0,
    max_tokens: 2048,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw);
  const applications: ExtractedApplication[] = Array.isArray(parsed)
    ? parsed
    : parsed.applications ?? [];

  return applications.filter((app) => app.title && app.company);
}

export async function generateCoverLetter(
  jobDescription: string,
  resumeText: string,
  extras?: { jobTitle?: string; company?: string }
) {
  const systemPrompt = `You are a professional cover letter writer. Write compelling, personalized cover letters that:
- Are concise (3-4 paragraphs)
- Highlight relevant experience from the resume that matches the job description
- Show enthusiasm for the specific role and company
- Use a professional but warm tone
- Avoid generic filler and clichés
- Do NOT include placeholder addresses or dates — start directly with the greeting`;

  const userPrompt = [
    "Write a cover letter for the following job:",
    extras?.jobTitle ? `Job Title: ${extras.jobTitle}` : null,
    extras?.company ? `Company: ${extras.company}` : null,
    "",
    "--- JOB DESCRIPTION ---",
    jobDescription,
    "",
    "--- MY RESUME ---",
    resumeText,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 1024,
  });

  return response.choices[0]?.message?.content ?? "";
}

export async function analyzeMatch(
  jobDescription: string,
  resumeText: string
): Promise<MatchAnalysis> {
  const systemPrompt = `You compare a candidate's resume against a job description and judge how well they match.

Return a JSON object with exactly these keys:
- "score": integer 0-100 for how well the resume meets the role's requirements. 85+ strong, 70-84 good, 50-69 partial, below 50 weak.
- "matchedSkills": up to 15 skills or qualifications from the job description that the resume clearly demonstrates
- "missingKeywords": up to 15 important skills, tools, or keywords from the job description that are absent or weak in the resume
- "suggestions": up to 5 specific resume edits that would improve the match (e.g. "Mention the PostgreSQL work in your Acme bullet"). Never suggest inventing experience.

Only return the JSON object.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `--- JOB DESCRIPTION ---\n${jobDescription}\n\n--- RESUME ---\n${resumeText}`,
      },
    ],
    temperature: 0,
    max_tokens: 1024,
    response_format: { type: "json_object" },
  });

  let json: unknown;
  try {
    json = JSON.parse(response.choices[0]?.message?.content ?? "");
  } catch {
    throw new InvalidMatchAnalysisError();
  }
  return parseMatchAnalysis(json);
}

export async function generateFollowUpEmail(details: {
  title: string;
  company: string;
  daysWaiting: number;
  resumeText?: string;
}) {
  const systemPrompt = `You write short, polite follow-up emails from a job applicant checking on the status of their application.
- Start with a "Subject:" line, then a blank line, then the email body
- 4-6 sentences: reaffirm interest, mention one relevant strength briefly, ask about next steps or timeline
- Professional and warm, never pushy or apologetic
- Use [Hiring Manager] as the greeting name and [Your Name] as the sign-off`;

  const userPrompt = [
    `Role: ${details.title}`,
    `Company: ${details.company}`,
    `Days since applying with no response: ${details.daysWaiting}`,
    details.resumeText ? `\n--- MY RESUME ---\n${details.resumeText}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 512,
  });

  return response.choices[0]?.message?.content ?? "";
}

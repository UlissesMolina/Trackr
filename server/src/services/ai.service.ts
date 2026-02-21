import openai from "../lib/openai";

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

import Groq from 'groq-sdk';

interface JobPost {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  salary?: string;
  type?: string;
}

export class GroqService {
  private client: Groq;
  private model = 'llama-3.1-8b-instant';

  constructor(apiKey: string) {
    this.client = new Groq({ apiKey });
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  async generateBatchJobPost(jobs: JobPost[]): Promise<string> {
    const jobList = jobs
      .map((job, i) => {
        const desc = this.stripHtml(job.description || '').substring(0, 200);
        return [
          `Job ${i + 1}:`,
          `  Title: ${job.title}`,
          `  Company: ${job.company}`,
          `  Location: ${job.location}`,
          job.type ? `  Type: ${job.type}` : null,
          job.salary ? `  Salary: ${job.salary}` : null,
          `  Description: ${desc}`,
          `  Apply URL: ${job.url}`,
        ]
          .filter(Boolean)
          .join('\n');
      })
      .join('\n\n');

    const systemPrompt = `You are an expert LinkedIn content writer for AcrossJob (acrossjob.com), a job discovery platform.
Your posts consistently get high engagement because they feel authentic, energetic, and human — not like a bot.

CRITICAL FORMATTING RULES (LinkedIn does NOT render Markdown):
- NEVER use ** for bold. LinkedIn ignores it and the asterisks appear as raw characters.
- NEVER use ## headers, __, or any Markdown syntax.
- Use ONLY plain text, emojis, line breaks, and Unicode separators for structure.
- Each job block must be separated by a blank line.
- The apply URL must appear on its own line with a 🔗 emoji prefix.
- Hashtags go on the very last line, space-separated.
- Total post must be under 2800 characters.`;

    const userPrompt = `Write an engaging LinkedIn post featuring these ${jobs.length} job opportunities.

Post structure to follow EXACTLY:
1. Opening hook (1-2 lines, punchy, with emojis — no generic phrases like "Take your career to the next level")
2. One short motivating sentence about the variety/quality of these roles
3. For EACH job, a block like this (plain text only, NO asterisks or markdown):

────────────────────
[number]️⃣ [Job Title] — [emoji that matches the role]
🏢 [Company] · 📍 [Location]
[if job type]: 💼 [Type]
[if salary]: 💰 [Salary]
[One compelling sentence about what makes this role exciting — based on the description]
🔗 [Apply URL]

4. Closing line encouraging people to visit acrossjob.com for more
5. Final line: hashtags only — #JobAlert #Hiring #JobOpportunities #Jobs #Career #AcrossJob

Jobs:
${jobList}

Return ONLY the post text. No preamble, no explanation, no markdown.`;

    try {
      console.log(`🤖 Generating LinkedIn post with Groq (${this.model})...`);

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1024,
        temperature: 0.8,
      });

      const content = completion.choices[0]?.message?.content?.trim();

      if (!content) {
        throw new Error('Groq returned empty content');
      }

      // Safety net: strip any ** that slipped through
      const cleaned = content.replace(/\*\*/g, '').replace(/\*/g, '').trim();

      console.log(`✅ Groq generated post (${cleaned.length} characters)`);
      return cleaned;
    } catch (error: any) {
      console.error('❌ Groq generation failed:', error.message);
      console.warn('⚠️  Falling back to template-based post generation');
      return this.fallbackBatchJobPost(jobs);
    }
  }

  private fallbackBatchJobPost(jobs: JobPost[]): string {
    const parts = [
      `🚀 NEW JOB OPPORTUNITIES 🚀`,
      '',
      `We've got ${jobs.length} exciting opportunities for you today! 👇`,
      '',
    ];

    jobs.forEach((job, index) => {
      parts.push(`────────────────────`);
      parts.push(``);
      parts.push(`${index + 1}️⃣ ${job.title}`);
      parts.push(`🏢 ${job.company} · 📍 ${job.location}`);
      if (job.type) parts.push(`💼 ${job.type}`);
      if (job.salary) parts.push(`💰 ${job.salary}`);
      if (job.description) {
        const cleanDesc = this.stripHtml(job.description);
        const shortDesc = cleanDesc.substring(0, 150).trim();
        parts.push(`${shortDesc}${cleanDesc.length > 150 ? '...' : ''}`);
      }
      parts.push(`🔗 ${job.url}`);
      parts.push(``);
    });

    parts.push(`────────────────────`);
    parts.push(``);
    parts.push(`💡 Explore more at acrossjob.com`);
    parts.push(``);
    parts.push(`#JobAlert #Hiring #JobOpportunities #Jobs #Career #AcrossJob`);

    return parts.join('\n');
  }
}

export default GroqService;

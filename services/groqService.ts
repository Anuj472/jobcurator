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

    const prompt = `You are a professional LinkedIn content writer for a job board called AcrossJob (acrossjob.com).

Generate an engaging, professional LinkedIn post featuring the following ${jobs.length} job opportunities. The post should:
- Start with an attention-grabbing hook (use relevant emojis)
- Present each job clearly with its key details (title, company, location, type, salary if available)
- Include the apply URL for each job
- End with a call-to-action mentioning acrossjob.com
- Include relevant hashtags at the bottom: #JobAlert #Hiring #JobOpportunities #Jobs #Career #AcrossJob
- Be formatted for LinkedIn (use line breaks, emojis for visual appeal)
- Stay under 2800 characters total
- Sound human and encouraging, not robotic

Jobs to feature:
${jobList}

Generate ONLY the LinkedIn post text. No extra commentary or explanation.`;

    try {
      console.log(`🤖 Generating LinkedIn post with Groq (${this.model})...`);

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024,
        temperature: 0.75,
      });

      const content = completion.choices[0]?.message?.content?.trim();

      if (!content) {
        throw new Error('Groq returned empty content');
      }

      console.log(`✅ Groq generated post (${content.length} characters)`);
      return content;
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
      parts.push(`════════════════════`);
      parts.push(``);
      parts.push(`${index + 1}️⃣ ${job.title}`);
      parts.push(`🏢 ${job.company}`);
      parts.push(`📍 ${job.location}`);
      if (job.type) parts.push(`💼 ${job.type}`);
      if (job.salary) parts.push(`💰 ${job.salary}`);
      if (job.description) {
        const cleanDesc = this.stripHtml(job.description);
        const shortDesc = cleanDesc.substring(0, 150).trim();
        parts.push(``);
        parts.push(`📋 ${shortDesc}${cleanDesc.length > 150 ? '...' : ''}`);
      }
      parts.push(``);
      parts.push(`🔗 Apply: ${job.url}`);
      parts.push(``);
    });

    parts.push(`════════════════════`);
    parts.push(``);
    parts.push(`💡 More opportunities at acrossjob.com`);
    parts.push(``);
    parts.push(`#JobAlert #Hiring #JobOpportunities #Jobs #Career #AcrossJob`);

    return parts.join('\n');
  }
}

export default GroqService;

import axios from 'axios';

interface JobPost {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  salary?: string;
  type?: string;
}

interface BatchJobPost {
  jobs: JobPost[];
}

export class LinkedInService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Format multiple jobs into a single LinkedIn post
   */
  private formatBatchJobPost(jobs: JobPost[]): string {
    const parts = [
      `🚀 NEW JOB OPPORTUNITIES 🚀`,
      '',
      `We've got ${jobs.length} exciting opportunities for you today! 👇`,
      '',
    ];

    jobs.forEach((job, index) => {
      parts.push(`━━━━━━━━━━━━━━━━━━━━`);
      parts.push(``);
      parts.push(`${index + 1}️⃣ ${job.title}`);
      parts.push(`🏢 ${job.company}`);
      parts.push(`📍 ${job.location}`);
      
      if (job.type) {
        parts.push(`💼 ${job.type}`);
      }
      
      if (job.salary) {
        parts.push(`💰 ${job.salary}`);
      }
      
      // Add description (limit to 200 chars per job)
      if (job.description) {
        const shortDesc = job.description.substring(0, 200).trim();
        parts.push(``);
        parts.push(`📋 ${shortDesc}${job.description.length > 200 ? '...' : ''}`);
      }
      
      parts.push(``);
      parts.push(`🔗 Apply: ${job.url}`);
      parts.push(``);
    });

    parts.push(`━━━━━━━━━━━━━━━━━━━━`);
    parts.push(``);
    parts.push(`💡 More opportunities at acrossjob.com`);
    parts.push(``);
    parts.push(`#JobAlert #Hiring #JobOpportunities #Jobs #Career #AcrossJob`);

    return parts.join('\n');
  }

  /**
   * Post multiple jobs in a single LinkedIn post
   */
  async postBatchJobs(jobs: JobPost[], authorUrn: string): Promise<boolean> {
    try {
      const postContent = this.formatBatchJobPost(jobs);

      // Check if content is too long (LinkedIn limit is 3000 chars)
      if (postContent.length > 3000) {
        console.log(`⚠️ Post too long (${postContent.length} chars), truncating...`);
      }

      // Create UGC post (LinkedIn Share API)
      const response = await axios.post(
        'https://api.linkedin.com/v2/ugcPosts',
        {
          author: authorUrn,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: postContent.substring(0, 3000), // Ensure within limit
              },
              shareMediaCategory: 'NONE',
            },
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      console.log(`✅ Successfully posted batch of ${jobs.length} jobs to LinkedIn`);
      return true;
    } catch (error: any) {
      console.error(`❌ Failed to post jobs to LinkedIn:`, error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Get user profile URN
   */
  async getUserUrn(): Promise<string> {
    try {
      const response = await axios.get('https://api.linkedin.com/v2/me', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      const urn = `urn:li:person:${response.data.id}`;
      console.log(`✅ User URN obtained: ${urn}`);
      return urn;
    } catch (error: any) {
      console.error('❌ Failed to get user URN:', error.response?.data || error.message);
      throw new Error('Failed to get LinkedIn user profile');
    }
  }

  /**
   * Validate access token
   */
  async validateToken(): Promise<boolean> {
    try {
      await axios.get('https://api.linkedin.com/v2/me', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default LinkedInService;
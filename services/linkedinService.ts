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

export class LinkedInService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Format job post content for LinkedIn
   */
  private formatJobPost(job: JobPost): string {
    const parts = [
      `🚀 New Job Opportunity: ${job.title}`,
      '',
      `🏢 Company: ${job.company}`,
      `📍 Location: ${job.location}`,
    ];

    if (job.type) {
      parts.push(`💼 Type: ${job.type}`);
    }

    if (job.salary) {
      parts.push(`💰 Salary: ${job.salary}`);
    }

    parts.push(
      '',
      '📋 Description:',
      job.description.substring(0, 500) + (job.description.length > 500 ? '...' : ''),
      '',
      `🔗 Apply Now: ${job.url}`,
      '',
      '#JobAlert #Hiring #JobOpportunity #AcrossJob'
    );

    return parts.join('\n');
  }

  /**
   * Post a job to LinkedIn using UGC Posts API
   */
  async postJob(job: JobPost, authorUrn: string): Promise<boolean> {
    try {
      const postContent = this.formatJobPost(job);

      // Create UGC post (LinkedIn Share API)
      const response = await axios.post(
        'https://api.linkedin.com/v2/ugcPosts',
        {
          author: authorUrn, // Format: "urn:li:person:{personId}" or "urn:li:organization:{organizationId}"
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: postContent,
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

      console.log(`✅ Successfully posted job: ${job.title} - ${job.location}`);
      return true;
    } catch (error: any) {
      console.error(`❌ Failed to post job to LinkedIn:`, error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Get user profile URN (needed for posting)
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
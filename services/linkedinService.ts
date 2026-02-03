import axios from 'axios';

interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

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
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  /**
   * Get OAuth access token using client credentials flow
   */
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post<LinkedInTokenResponse>(
        'https://www.linkedin.com/oauth/v2/accessToken',
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // Refresh 1 min before expiry

      console.log('✅ LinkedIn access token obtained');
      return this.accessToken;
    } catch (error: any) {
      console.error('❌ Failed to get LinkedIn access token:', error.response?.data || error.message);
      throw new Error('LinkedIn authentication failed');
    }
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
      const accessToken = await this.getAccessToken();
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
            'Authorization': `Bearer ${accessToken}`,
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
      const accessToken = await this.getAccessToken();
      
      const response = await axios.get('https://api.linkedin.com/v2/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
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
}

export default LinkedInService;
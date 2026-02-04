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
      parts.push(`════════════════════`);
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

    parts.push(`════════════════════`);
    parts.push(``);
    parts.push(`💡 More opportunities at acrossjob.com`);
    parts.push(``);
    parts.push(`#JobAlert #Hiring #JobOpportunities #Jobs #Career #AcrossJob`);

    return parts.join('\n');
  }

  /**
   * Post multiple jobs in a single LinkedIn post using REST API
   */
  async postBatchJobs(jobs: JobPost[], authorUrn: string): Promise<boolean> {
    try {
      const postContent = this.formatBatchJobPost(jobs);

      // Check if content is too long (LinkedIn limit is 3000 chars)
      if (postContent.length > 3000) {
        console.log(`⚠️ Post too long (${postContent.length} chars), truncating...`);
      }

      console.log(`📤 Posting to LinkedIn with author: ${authorUrn}`);
      console.log(`📝 Post length: ${postContent.length} characters`);

      // Use the new REST API (LinkedIn API v2.1)
      // Reference: https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin
      const response = await axios.post(
        'https://api.linkedin.com/rest/posts',
        {
          author: authorUrn,
          commentary: postContent.substring(0, 3000),
          visibility: 'PUBLIC',
          distribution: {
            feedDistribution: 'MAIN_FEED',
            targetEntities: [],
            thirdPartyDistributionChannels: []
          },
          lifecycleState: 'PUBLISHED',
          isReshareDisabledByAuthor: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
            'LinkedIn-Version': '202402'
          },
        }
      );

      console.log(`✅ Successfully posted batch of ${jobs.length} jobs to LinkedIn`);
      console.log(`📊 Response status: ${response.status}`);
      if (response.headers && response.headers['x-restli-id']) {
        console.log(`🆔 Post ID: ${response.headers['x-restli-id']}`);
      }
      return true;
    } catch (error: any) {
      console.error(`❌ Failed to post jobs to LinkedIn:`);
      console.error(`Status: ${error.response?.status}`);
      console.error(`Status Text: ${error.response?.statusText}`);
      console.error(`Data:`, JSON.stringify(error.response?.data, null, 2));
      console.error(`Message: ${error.message}`);
      
      // Additional debugging info
      if (error.response?.status === 401) {
        console.error('🚨 Unauthorized - Token may be expired or invalid');
      } else if (error.response?.status === 403) {
        console.error('🚨 Forbidden - Check if:');
        console.error('   1. You have w_member_social permission');
        console.error('   2. You are admin of the organization (for org posts)');
        console.error('   3. URN format is correct');
      } else if (error.response?.status === 422) {
        console.error('🚨 Validation error - Check post content and URN format');
      } else if (error.response?.status === 426) {
        console.error('🚨 Upgrade Required - Try different API version');
        console.error('   Current version: 202402');
      }
      
      return false;
    }
  }

  /**
   * Get user profile URN
   */
  async getUserUrn(): Promise<string> {
    try {
      console.log(`🔍 Fetching user profile from LinkedIn...`);
      const response = await axios.get('https://api.linkedin.com/v2/me', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      const urn = `urn:li:person:${response.data.id}`;
      console.log(`✅ User URN obtained: ${urn}`);
      return urn;
    } catch (error: any) {
      console.error('❌ Failed to get user URN:');
      console.error(`Status: ${error.response?.status}`);
      console.error(`Status Text: ${error.response?.statusText}`);
      console.error(`Data:`, JSON.stringify(error.response?.data, null, 2));
      console.error(`Message: ${error.message}`);
      throw new Error('Failed to get LinkedIn user profile');
    }
  }

  /**
   * Validate access token
   */
  async validateToken(): Promise<boolean> {
    try {
      console.log(`🔍 Calling LinkedIn API to validate token...`);
      console.log(`Token length: ${this.accessToken.length}`);
      console.log(`Token starts with: ${this.accessToken.substring(0, 10)}...`);
      
      const response = await axios.get('https://api.linkedin.com/v2/me', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });
      
      console.log(`✅ Token validation successful`);
      console.log(`User ID: ${response.data.id}`);
      return true;
    } catch (error: any) {
      console.error('❌ Token validation failed:');
      console.error(`Status: ${error.response?.status}`);
      console.error(`Status Text: ${error.response?.statusText}`);
      console.error(`Data:`, JSON.stringify(error.response?.data, null, 2));
      console.error(`Message: ${error.message}`);
      
      if (error.response?.status === 401) {
        console.error('🚨 Unauthorized - Token is invalid or expired');
      } else if (error.response?.status === 403) {
        console.error('🚨 Forbidden - Token lacks required permissions');
      }
      
      return false;
    }
  }
}

export default LinkedInService;
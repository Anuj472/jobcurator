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
   * Strip HTML tags from text
   */
  private stripHtml(html: string): string {
    // Remove HTML tags
    let text = html.replace(/<[^>]*>/g, '');
    // Decode common HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    // Remove extra whitespace
    text = text.replace(/\s+/g, ' ').trim();
    return text;
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
      
      // Add description (strip HTML and limit to 150 chars per job for better fit)
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

  /**
   * Post multiple jobs in a single LinkedIn post using v2 UGC API
   * This API doesn't require LinkedIn-Version header
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
      console.log(`📦 Using v2 UGC API (no version header required)`);

      // Use v2 UGC API which is more stable and doesn't require version headers
      const response = await axios.post(
        'https://api.linkedin.com/v2/ugcPosts',
        {
          author: authorUrn,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: postContent.substring(0, 3000)
              },
              shareMediaCategory: 'NONE'
            }
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          }
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
        console.error('🚨 Forbidden - Possible causes:');
        console.error('   1. Token needs w_member_social permission');
        console.error('   2. For organization posts: must be admin AND use org URN');
        console.error('   3. URN format: urn:li:organization:ID or urn:li:person:ID');
        console.error(`   4. Current URN: ${authorUrn}`);
      } else if (error.response?.status === 422) {
        console.error('🚨 Validation error - Check post content and URN format');
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
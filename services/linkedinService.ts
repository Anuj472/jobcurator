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
  private refreshToken: string | null;
  private clientId: string | null;
  private clientSecret: string | null;

  constructor(
    accessToken: string,
    refreshToken?: string,
    clientId?: string,
    clientSecret?: string
  ) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken || null;
    this.clientId = clientId || null;
    this.clientSecret = clientSecret || null;
  }

  // ─── Token Management ────────────────────────────────────────────────────

  /**
   * Try to refresh the access token using the refresh token.
   * LinkedIn refresh tokens are valid for 365 days.
   * Returns the new access token string or null on failure.
   */
  async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshToken || !this.clientId || !this.clientSecret) {
      console.warn('⚠️  Cannot refresh token: missing LINKEDIN_REFRESH_TOKEN, LINKEDIN_CLIENT_ID, or LINKEDIN_CLIENT_SECRET');
      return null;
    }

    try {
      console.log('🔄 Refreshing LinkedIn access token...');
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      });

      const response = await axios.post(
        'https://www.linkedin.com/oauth/v2/accessToken',
        params.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      const newToken: string = response.data.access_token;
      const expiresIn: number = response.data.expires_in ?? 5183944;
      const newRefresh: string | undefined = response.data.refresh_token;

      this.accessToken = newToken;
      if (newRefresh) this.refreshToken = newRefresh;

      const expiryDate = new Date(Date.now() + expiresIn * 1000).toISOString();
      console.log(`✅ Token refreshed successfully! New token expires: ${expiryDate}`);
      console.log('⚠️  ACTION REQUIRED: Update LINKEDIN_ACCESS_TOKEN secret in GitHub with the new token below:');
      console.log(`🔑 NEW_ACCESS_TOKEN=${newToken}`);
      if (newRefresh) {
        console.log(`🔑 NEW_REFRESH_TOKEN=${newRefresh}`);
      }

      return newToken;
    } catch (error: any) {
      console.error('❌ Token refresh failed:');
      console.error(`Status: ${error.response?.status}`);
      console.error(`Data:`, JSON.stringify(error.response?.data, null, 2));
      return null;
    }
  }

  /**
   * Checks if the current token is valid. If it returns 401, tries to refresh.
   * Returns true if we have a working token, false otherwise.
   */
  async ensureValidToken(): Promise<boolean> {
    try {
      await axios.get('https://api.linkedin.com/v2/me', {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      console.log('✅ Access token is valid.');
      return true;
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.warn('⚠️  Access token expired (401). Attempting refresh...');
        const newToken = await this.refreshAccessToken();
        if (newToken) return true;
        console.error('❌ Could not refresh token. Please manually update LINKEDIN_ACCESS_TOKEN secret.');
        return false;
      }
      // Non-401 error — network issue etc. Proceed and let the post fail naturally.
      console.warn(`⚠️  Token check returned ${error.response?.status}. Proceeding anyway.`);
      return true;
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

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

  // ─── Posting ─────────────────────────────────────────────────────────────

  async postBatchJobs(jobs: JobPost[], authorUrn: string): Promise<boolean> {
    // Always check / refresh token before posting
    const tokenOk = await this.ensureValidToken();
    if (!tokenOk) {
      console.error('❌ Aborting post — no valid LinkedIn access token.');
      return false;
    }

    try {
      const postContent = this.formatBatchJobPost(jobs);

      if (postContent.length > 3000) {
        console.log(`⚠️ Post too long (${postContent.length} chars), truncating...`);
      }

      console.log(`📤 Posting to LinkedIn with author: ${authorUrn}`);
      console.log(`📝 Post length: ${postContent.length} characters`);
      console.log(`📦 Using v2 UGC API`);

      const response = await axios.post(
        'https://api.linkedin.com/v2/ugcPosts',
        {
          author: authorUrn,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: { text: postContent.substring(0, 3000) },
              shareMediaCategory: 'NONE',
            },
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      console.log(`✅ Successfully posted batch of ${jobs.length} jobs to LinkedIn`);
      console.log(`📊 Response status: ${response.status}`);
      if (response.headers?.['x-restli-id']) {
        console.log(`🆔 Post ID: ${response.headers['x-restli-id']}`);
      }
      return true;
    } catch (error: any) {
      console.error(`❌ Failed to post jobs to LinkedIn:`);
      console.error(`Status: ${error.response?.status}`);
      console.error(`Status Text: ${error.response?.statusText}`);
      console.error(`Data:`, JSON.stringify(error.response?.data, null, 2));
      console.error(`Message: ${error.message}`);

      if (error.response?.status === 401) {
        console.error('🚨 Unauthorized — token refresh was attempted but post still failed.');
        console.error('   Please regenerate your token at https://www.linkedin.com/developers/apps');
      } else if (error.response?.status === 403) {
        console.error('🚨 Forbidden — token lacks w_member_social or w_organization_social scope');
        console.error(`   Current author URN: ${authorUrn}`);
      } else if (error.response?.status === 422) {
        console.error('🚨 Validation error — check URN format and post content');
      }

      return false;
    }
  }

  // ─── Utilities ───────────────────────────────────────────────────────────

  async getUserUrn(): Promise<string> {
    const response = await axios.get('https://api.linkedin.com/v2/me', {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    return `urn:li:person:${response.data.id}`;
  }

  async validateToken(): Promise<boolean> {
    return this.ensureValidToken();
  }
}

export default LinkedInService;

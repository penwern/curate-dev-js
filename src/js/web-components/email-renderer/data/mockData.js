/**
 * Mock data for email viewer
 * Matches manifest.json structure from plan.md
 */

export const mockManifest = {
  source: "sample-archive.mbox",
  processedDate: "2024-03-15T10:30:00Z",
  totalEmails: 15,
  version: "1.0",

  emails: [
    // Thread 1: Budget discussion (3 emails)
    {
      id: "001",
      folder: "001",
      emlPath: "001/message.eml",
      from: { name: "Alice Johnson", email: "alice@company.com" },
      to: [{ name: "Bob Smith", email: "bob@company.com" }],
      cc: [{ name: "Carol White", email: "carol@company.com" }],
      bcc: [],
      replyTo: null,
      subject: "Q4 Budget Review",
      date: "2024-03-15T14:30:00Z",
      snippet: "Here's the budget analysis for Q4 including projections and actual spend across all departments...",
      messageId: "<msg001@company.com>",
      inReplyTo: null,
      references: [],
      threadId: "thread-001",
      attachments: [
        {
          filename: "Q4-Budget-Analysis.xlsx",
          path: "001/attachments/Q4-Budget-Analysis.xlsx",
          size: 45600,
          mimeType: "application/vnd.ms-excel",
          inline: false,
          contentId: null
        }
      ],
      hasExternalImages: false,
      hasAttachments: true
    },
    {
      id: "002",
      folder: "002",
      emlPath: "002/message.eml",
      from: { name: "Bob Smith", email: "bob@company.com" },
      to: [{ name: "Alice Johnson", email: "alice@company.com" }],
      cc: [{ name: "Carol White", email: "carol@company.com" }],
      bcc: [],
      replyTo: null,
      subject: "Re: Q4 Budget Review",
      date: "2024-03-15T15:45:00Z",
      snippet: "Thanks Alice! The numbers look good overall. I have a few questions about the marketing spend...",
      messageId: "<msg002@company.com>",
      inReplyTo: "<msg001@company.com>",
      references: ["<msg001@company.com>"],
      threadId: "thread-001",
      attachments: [],
      hasExternalImages: false,
      hasAttachments: false
    },
    {
      id: "003",
      folder: "003",
      emlPath: "003/message.eml",
      from: { name: "Alice Johnson", email: "alice@company.com" },
      to: [{ name: "Bob Smith", email: "bob@company.com" }],
      cc: [{ name: "Carol White", email: "carol@company.com" }],
      bcc: [],
      replyTo: null,
      subject: "Re: Q4 Budget Review",
      date: "2024-03-15T16:20:00Z",
      snippet: "Good catch! Let me clarify the marketing allocation. See the updated breakdown attached...",
      messageId: "<msg003@company.com>",
      inReplyTo: "<msg002@company.com>",
      references: ["<msg001@company.com>", "<msg002@company.com>"],
      threadId: "thread-001",
      attachments: [
        {
          filename: "Marketing-Breakdown.pdf",
          path: "003/attachments/Marketing-Breakdown.pdf",
          size: 234500,
          mimeType: "application/pdf",
          inline: false,
          contentId: null
        }
      ],
      hasExternalImages: false,
      hasAttachments: true
    },

    // Thread 2: Design feedback (2 emails)
    {
      id: "004",
      folder: "004",
      emlPath: "004/message.eml",
      from: { name: "Design Team", email: "design@company.com" },
      to: [{ name: "Product Team", email: "product@company.com" }],
      cc: [],
      bcc: [],
      replyTo: null,
      subject: "New Homepage Design Mockups",
      date: "2024-03-14T09:00:00Z",
      snippet: "Hi team! We've completed the homepage redesign mockups. Please review and provide feedback by EOW...",
      messageId: "<msg004@company.com>",
      inReplyTo: null,
      references: [],
      threadId: "thread-002",
      attachments: [
        {
          filename: "homepage-v2.png",
          path: "004/attachments/homepage-v2.png",
          size: 856200,
          mimeType: "image/png",
          inline: true,
          contentId: "homepage@company.com"
        },
        {
          filename: "mobile-view.png",
          path: "004/attachments/mobile-view.png",
          size: 423100,
          mimeType: "image/png",
          inline: true,
          contentId: "mobile@company.com"
        }
      ],
      hasExternalImages: false,
      hasAttachments: true
    },
    {
      id: "005",
      folder: "005",
      emlPath: "005/message.eml",
      from: { name: "Product Team", email: "product@company.com" },
      to: [{ name: "Design Team", email: "design@company.com" }],
      cc: [],
      bcc: [],
      replyTo: null,
      subject: "Re: New Homepage Design Mockups",
      date: "2024-03-14T14:30:00Z",
      snippet: "Love the new direction! A few suggestions: 1. CTA button could be more prominent 2. Consider...",
      messageId: "<msg005@company.com>",
      inReplyTo: "<msg004@company.com>",
      references: ["<msg004@company.com>"],
      threadId: "thread-002",
      attachments: [],
      hasExternalImages: false,
      hasAttachments: false
    },

    // Standalone emails
    {
      id: "006",
      folder: "006",
      emlPath: "006/message.eml",
      from: { name: "Newsletter Service", email: "news@example.com" },
      to: [{ name: "You", email: "user@company.com" }],
      cc: [],
      bcc: [],
      replyTo: null,
      subject: "Your Weekly Tech Digest",
      date: "2024-03-13T08:00:00Z",
      snippet: "Top stories this week: AI breakthroughs, new framework releases, and industry insights...",
      messageId: "<msg006@example.com>",
      inReplyTo: null,
      references: [],
      threadId: null,
      attachments: [],
      hasExternalImages: true,
      hasAttachments: false
    },
    {
      id: "007",
      folder: "007",
      emlPath: "007/message.eml",
      from: { name: "HR Department", email: "hr@company.com" },
      to: [
        { name: "Alice Johnson", email: "alice@company.com" },
        { name: "Bob Smith", email: "bob@company.com" },
        { name: "Carol White", email: "carol@company.com" },
        { name: "David Brown", email: "david@company.com" },
        { name: "Eve Davis", email: "eve@company.com" }
      ],
      cc: [],
      bcc: [],
      replyTo: null,
      subject: "Important: Benefits Enrollment Deadline March 31st",
      date: "2024-03-12T10:00:00Z",
      snippet: "Reminder: The deadline for benefits enrollment is approaching. Please complete your selections by March 31st...",
      messageId: "<msg007@company.com>",
      inReplyTo: null,
      references: [],
      threadId: null,
      attachments: [
        {
          filename: "Benefits-Guide-2024.pdf",
          path: "007/attachments/Benefits-Guide-2024.pdf",
          size: 1245000,
          mimeType: "application/pdf",
          inline: false,
          contentId: null
        }
      ],
      hasExternalImages: false,
      hasAttachments: true
    },
    {
      id: "008",
      folder: "008",
      emlPath: "008/message.eml",
      from: { name: "GitHub", email: "noreply@github.com" },
      to: [{ name: "Developer", email: "dev@company.com" }],
      cc: [],
      bcc: [],
      replyTo: null,
      subject: "[company/project] Pull Request #42: Add email viewer component",
      date: "2024-03-11T16:22:00Z",
      snippet: "Alice Johnson wants to merge 3 commits into main from feature/email-viewer...",
      messageId: "<msg008@github.com>",
      inReplyTo: null,
      references: [],
      threadId: null,
      attachments: [],
      hasExternalImages: true,
      hasAttachments: false
    },
    {
      id: "009",
      folder: "009",
      emlPath: "009/message.eml",
      from: { name: "Security Team", email: "security@company.com" },
      to: [{ name: "All Employees", email: "everyone@company.com" }],
      cc: [],
      bcc: [],
      replyTo: null,
      subject: "🔒 Monthly Security Update - Action Required",
      date: "2024-03-10T09:00:00Z",
      snippet: "As part of our ongoing security improvements, please update your password and enable 2FA by March 15th...",
      messageId: "<msg009@company.com>",
      inReplyTo: null,
      references: [],
      threadId: null,
      attachments: [],
      hasExternalImages: false,
      hasAttachments: false
    },
    {
      id: "010",
      folder: "010",
      emlPath: "010/message.eml",
      from: { name: "Meeting Scheduler", email: "calendar@company.com" },
      to: [{ name: "Alice Johnson", email: "alice@company.com" }],
      cc: [],
      bcc: [],
      replyTo: null,
      subject: "Invitation: Quarterly Planning Meeting @ Thu Mar 21, 2024 2pm - 3pm (alice@company.com)",
      date: "2024-03-09T11:30:00Z",
      snippet: "You have been invited to Quarterly Planning Meeting on Thursday, March 21st at 2:00 PM...",
      messageId: "<msg010@company.com>",
      inReplyTo: null,
      references: [],
      threadId: null,
      attachments: [
        {
          filename: "meeting.ics",
          path: "010/attachments/meeting.ics",
          size: 1200,
          mimeType: "text/calendar",
          inline: false,
          contentId: null
        }
      ],
      hasExternalImages: false,
      hasAttachments: true
    },
    {
      id: "011",
      folder: "011",
      emlPath: "011/message.eml",
      from: { name: "Support Ticket", email: "support@company.com" },
      to: [{ name: "Customer", email: "customer@example.com" }],
      cc: [],
      bcc: [],
      replyTo: { name: "Support Team", email: "help@company.com" },
      subject: "Re: [Ticket #1234] Login issues",
      date: "2024-03-08T14:15:00Z",
      snippet: "Thank you for contacting support. We've investigated the login issue and found the cause...",
      messageId: "<msg011@company.com>",
      inReplyTo: null,
      references: [],
      threadId: null,
      attachments: [],
      hasExternalImages: false,
      hasAttachments: false
    },
    {
      id: "012",
      folder: "012",
      emlPath: "012/message.eml",
      from: { name: "Sales Team", email: "sales@company.com" },
      to: [{ name: "Leadership", email: "leadership@company.com" }],
      cc: [],
      bcc: [],
      replyTo: null,
      subject: "Q1 Sales Report - Record Breaking Quarter! 🎉",
      date: "2024-03-07T16:00:00Z",
      snippet: "Excited to share that we've exceeded our Q1 targets by 23%! Here's the full breakdown...",
      messageId: "<msg012@company.com>",
      inReplyTo: null,
      references: [],
      threadId: null,
      attachments: [
        {
          filename: "Q1-Sales-Report.xlsx",
          path: "012/attachments/Q1-Sales-Report.xlsx",
          size: 67800,
          mimeType: "application/vnd.ms-excel",
          inline: false,
          contentId: null
        },
        {
          filename: "regional-breakdown.csv",
          path: "012/attachments/regional-breakdown.csv",
          size: 8900,
          mimeType: "text/csv",
          inline: false,
          contentId: null
        }
      ],
      hasExternalImages: false,
      hasAttachments: true
    },
    {
      id: "013",
      folder: "013",
      emlPath: "013/message.eml",
      from: { name: "Marketing Automation", email: "marketing@service.com" },
      to: [{ name: "Subscriber", email: "user@company.com" }],
      cc: [],
      bcc: [],
      replyTo: null,
      subject: "Don't Miss Out! 50% Off Premium Plans This Week Only",
      date: "2024-03-06T12:00:00Z",
      snippet: "Limited time offer: Upgrade to Premium and save 50%. Offer expires March 13th...",
      messageId: "<msg013@service.com>",
      inReplyTo: null,
      references: [],
      threadId: null,
      attachments: [],
      hasExternalImages: true,
      hasAttachments: false
    },
    {
      id: "014",
      folder: "014",
      emlPath: "014/message.eml",
      from: { name: "IT Department", email: "it@company.com" },
      to: [{ name: "All Staff", email: "staff@company.com" }],
      cc: [],
      bcc: [],
      replyTo: null,
      subject: "Scheduled Maintenance: Network Upgrade - Sunday 3/17 2AM-6AM",
      date: "2024-03-05T09:00:00Z",
      snippet: "Please be advised that we will be performing network infrastructure upgrades on Sunday, March 17th from 2:00 AM to 6:00 AM. All systems will be unavailable during this time...",
      messageId: "<msg014@company.com>",
      inReplyTo: null,
      references: [],
      threadId: null,
      attachments: [],
      hasExternalImages: false,
      hasAttachments: false
    },
    {
      id: "015",
      folder: "015",
      emlPath: "015/message.eml",
      from: { name: "Carlos Garcia", email: "carlos@vendor.com" },
      to: [{ name: "Procurement", email: "procurement@company.com" }],
      cc: [],
      bcc: [],
      replyTo: null,
      subject: "Proposal: Enterprise Software Licensing Agreement",
      date: "2024-03-04T10:30:00Z",
      snippet: "Thank you for your interest in our enterprise solutions. Attached is our proposal for a 3-year licensing agreement with volume discounts...",
      messageId: "<msg015@vendor.com>",
      inReplyTo: null,
      references: [],
      threadId: null,
      attachments: [
        {
          filename: "Enterprise-Proposal-2024.pdf",
          path: "015/attachments/Enterprise-Proposal-2024.pdf",
          size: 456700,
          mimeType: "application/pdf",
          inline: false,
          contentId: null
        },
        {
          filename: "pricing-breakdown.xlsx",
          path: "015/attachments/pricing-breakdown.xlsx",
          size: 23400,
          mimeType: "application/vnd.ms-excel",
          inline: false,
          contentId: null
        }
      ],
      hasExternalImages: false,
      hasAttachments: true
    }
  ],

  threads: {
    "thread-001": ["001", "002", "003"],
    "thread-002": ["004", "005"]
  }
};

/**
 * Mock email body content (HTML and plain text)
 * In Phase 2, this will come from parsed EML files
 */
export const mockEmailBodies = {
  "001": {
    html: `
      <p>Hi Bob,</p>
      <p>Here's the budget analysis for Q4 including projections and actual spend across all departments.</p>
      <p>Key highlights:</p>
      <ul>
        <li>Engineering: On track, 98% of budget utilized</li>
        <li>Marketing: Over budget by 12% due to additional campaign spend</li>
        <li>Sales: Under budget by 8%, strong performance</li>
        <li>Operations: Exactly on target</li>
      </ul>
      <p>Please review the attached spreadsheet for detailed breakdowns. Let's discuss any concerns in tomorrow's meeting.</p>
      <p>Best regards,<br>Alice</p>
    `,
    text: "Hi Bob,\n\nHere's the budget analysis for Q4 including projections and actual spend across all departments.\n\nKey highlights:\n- Engineering: On track, 98% of budget utilized\n- Marketing: Over budget by 12% due to additional campaign spend\n- Sales: Under budget by 8%, strong performance\n- Operations: Exactly on target\n\nPlease review the attached spreadsheet for detailed breakdowns. Let's discuss any concerns in tomorrow's meeting.\n\nBest regards,\nAlice"
  },
  "002": {
    html: `
      <p>Thanks Alice!</p>
      <p>The numbers look good overall. I have a few questions about the marketing spend:</p>
      <ol>
        <li>What was the ROI on the additional campaign spend?</li>
        <li>Is the overage a one-time event or should we adjust Q1 budget?</li>
        <li>Which channels performed best?</li>
      </ol>
      <p>Can you provide more details?</p>
      <p>Thanks,<br>Bob</p>
    `,
    text: "Thanks Alice!\n\nThe numbers look good overall. I have a few questions about the marketing spend:\n\n1. What was the ROI on the additional campaign spend?\n2. Is the overage a one-time event or should we adjust Q1 budget?\n3. Which channels performed best?\n\nCan you provide more details?\n\nThanks,\nBob"
  },
  "003": {
    html: `
      <p>Good catch Bob! Let me clarify the marketing allocation.</p>
      <blockquote style="border-left: 3px solid #ccc; padding-left: 12px; margin: 16px 0; color: #666;">
        <p><strong>Bob Smith wrote:</strong></p>
        <p>What was the ROI on the additional campaign spend?</p>
      </blockquote>
      <p>The ROI was 3.2x, well above our 2.5x target. See the updated breakdown attached.</p>
      <p>Regarding budget adjustment: I recommend increasing Q1 marketing by 10% to capitalize on the momentum.</p>
      <p>Top channels:</p>
      <ul>
        <li>Social media: 4.1x ROI</li>
        <li>Content marketing: 3.8x ROI</li>
        <li>Email campaigns: 2.9x ROI</li>
      </ul>
      <p>Alice</p>
    `,
    text: "Good catch Bob! Let me clarify the marketing allocation.\n\n> Bob Smith wrote:\n> What was the ROI on the additional campaign spend?\n\nThe ROI was 3.2x, well above our 2.5x target. See the updated breakdown attached.\n\nRegarding budget adjustment: I recommend increasing Q1 marketing by 10% to capitalize on the momentum.\n\nTop channels:\n- Social media: 4.1x ROI\n- Content marketing: 3.8x ROI\n- Email campaigns: 2.9x ROI\n\nAlice"
  },
  "004": {
    html: `
      <p>Hi team!</p>
      <p>We've completed the homepage redesign mockups. Please review and provide feedback by end of week.</p>
      <h3>Desktop Version:</h3>
      <p><img src="cid:homepage@company.com" alt="Homepage Design" style="max-width: 100%; border: 1px solid #ddd;"></p>
      <h3>Mobile Version:</h3>
      <p><img src="cid:mobile@company.com" alt="Mobile View" style="max-width: 100%; border: 1px solid #ddd;"></p>
      <p>Key changes:</p>
      <ul>
        <li>Cleaner, more modern aesthetic</li>
        <li>Improved mobile responsiveness</li>
        <li>Better visual hierarchy</li>
        <li>Accessibility improvements (WCAG 2.1 AA compliant)</li>
      </ul>
      <p>Looking forward to your thoughts!</p>
      <p>Design Team</p>
    `,
    text: "Hi team!\n\nWe've completed the homepage redesign mockups. Please review and provide feedback by end of week.\n\nKey changes:\n- Cleaner, more modern aesthetic\n- Improved mobile responsiveness\n- Better visual hierarchy\n- Accessibility improvements (WCAG 2.1 AA compliant)\n\nSee attached mockups for desktop and mobile versions.\n\nLooking forward to your thoughts!\n\nDesign Team"
  },
  "005": {
    html: `
      <p>Love the new direction!</p>
      <p>A few suggestions:</p>
      <ol>
        <li>CTA button could be more prominent (consider primary color)</li>
        <li>Testimonials section should be above the fold on desktop</li>
        <li>Product imagery needs more visual weight</li>
        <li>Consider adding a video hero section</li>
      </ol>
      <p>Overall this is a huge improvement. Let's iterate on these points and ship it!</p>
      <p>Product Team</p>
    `,
    text: "Love the new direction!\n\nA few suggestions:\n1. CTA button could be more prominent (consider primary color)\n2. Testimonials section should be above the fold on desktop\n3. Product imagery needs more visual weight\n4. Consider adding a video hero section\n\nOverall this is a huge improvement. Let's iterate on these points and ship it!\n\nProduct Team"
  },
  "006": {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Your Weekly Tech Digest</h2>
        <p>Top stories this week:</p>
        <div style="border: 1px solid #ddd; padding: 16px; margin: 16px 0;">
          <h3>AI Breakthroughs in Natural Language Processing</h3>
          <p>New models achieve unprecedented accuracy in context understanding...</p>
          <img src="https://example.com/external-image.jpg" alt="AI News">
        </div>
        <div style="border: 1px solid #ddd; padding: 16px; margin: 16px 0;">
          <h3>Framework Update: v4.0 Released</h3>
          <p>Major performance improvements and new features...</p>
        </div>
        <p style="color: #666; font-size: 12px;">You're receiving this because you subscribed to our newsletter.</p>
      </div>
    `,
    text: "Your Weekly Tech Digest\n\nTop stories this week:\n\nAI Breakthroughs in Natural Language Processing\nNew models achieve unprecedented accuracy in context understanding...\n\nFramework Update: v4.0 Released\nMajor performance improvements and new features...\n\nYou're receiving this because you subscribed to our newsletter."
  },
  "007": {
    html: `
      <p><strong>Important Reminder</strong></p>
      <p>The deadline for benefits enrollment is approaching. Please complete your selections by <strong>March 31st</strong>.</p>
      <h3>What you need to do:</h3>
      <ol>
        <li>Log into the benefits portal at <a href="https://benefits.company.com">benefits.company.com</a></li>
        <li>Review available plans (medical, dental, vision, 401k)</li>
        <li>Make your selections</li>
        <li>Submit your enrollment</li>
      </ol>
      <p>If you miss the deadline, you'll be automatically enrolled in the default plan and won't be able to make changes until next year.</p>
      <p>Attached is the comprehensive benefits guide with plan details and comparison charts.</p>
      <p>Questions? Contact HR at hr@company.com</p>
      <p>HR Department</p>
    `,
    text: "Important Reminder\n\nThe deadline for benefits enrollment is approaching. Please complete your selections by March 31st.\n\nWhat you need to do:\n1. Log into the benefits portal at benefits.company.com\n2. Review available plans (medical, dental, vision, 401k)\n3. Make your selections\n4. Submit your enrollment\n\nIf you miss the deadline, you'll be automatically enrolled in the default plan and won't be able to make changes until next year.\n\nAttached is the comprehensive benefits guide with plan details and comparison charts.\n\nQuestions? Contact HR at hr@company.com\n\nHR Department"
  },
  "008": {
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
        <p>Alice Johnson wants to merge 3 commits into <code>main</code> from <code>feature/email-viewer</code></p>
        <h3>Changes:</h3>
        <ul>
          <li>Add email-viewer component with split pane layout</li>
          <li>Implement virtual scrolling for email list</li>
          <li>Add DOMPurify for HTML sanitization</li>
        </ul>
        <p><strong>+847</strong> additions, <strong>-12</strong> deletions across 8 files</p>
        <p><a href="https://github.com/company/project/pull/42" style="background: #2ea44f; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px;">View Pull Request</a></p>
        <img src="https://github.com/identicons/user123.png" alt="Profile">
      </div>
    `,
    text: "Alice Johnson wants to merge 3 commits into main from feature/email-viewer\n\nChanges:\n- Add email-viewer component with split pane layout\n- Implement virtual scrolling for email list\n- Add DOMPurify for HTML sanitization\n\n+847 additions, -12 deletions across 8 files\n\nView Pull Request: https://github.com/company/project/pull/42"
  },
  "009": {
    html: `
      <h2>🔒 Monthly Security Update - Action Required</h2>
      <p>As part of our ongoing security improvements, please complete the following by <strong>March 15th</strong>:</p>
      <h3>Required Actions:</h3>
      <ol>
        <li><strong>Update your password</strong>
          <ul>
            <li>Minimum 12 characters</li>
            <li>Mix of uppercase, lowercase, numbers, and symbols</li>
            <li>Cannot reuse last 5 passwords</li>
          </ul>
        </li>
        <li><strong>Enable Two-Factor Authentication (2FA)</strong>
          <ul>
            <li>Download authenticator app (Authy, Google Authenticator, or Microsoft Authenticator)</li>
            <li>Scan QR code in account settings</li>
            <li>Save backup codes in secure location</li>
          </ul>
        </li>
      </ol>
      <p><strong>Why this matters:</strong> These measures significantly reduce the risk of unauthorized access to company systems and data.</p>
      <p>Need help? Contact security@company.com or visit the IT helpdesk.</p>
      <p>Security Team</p>
    `,
    text: "🔒 Monthly Security Update - Action Required\n\nAs part of our ongoing security improvements, please complete the following by March 15th:\n\nRequired Actions:\n1. Update your password\n   - Minimum 12 characters\n   - Mix of uppercase, lowercase, numbers, and symbols\n   - Cannot reuse last 5 passwords\n\n2. Enable Two-Factor Authentication (2FA)\n   - Download authenticator app (Authy, Google Authenticator, or Microsoft Authenticator)\n   - Scan QR code in account settings\n   - Save backup codes in secure location\n\nWhy this matters: These measures significantly reduce the risk of unauthorized access to company systems and data.\n\nNeed help? Contact security@company.com or visit the IT helpdesk.\n\nSecurity Team"
  },
  "010": {
    html: `
      <div style="border: 1px solid #ddd; padding: 20px; border-radius: 4px;">
        <h2 style="margin-top: 0;">📅 Meeting Invitation</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; font-weight: bold;">Event:</td>
            <td style="padding: 8px;">Quarterly Planning Meeting</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">When:</td>
            <td style="padding: 8px;">Thursday, March 21, 2024 at 2:00 PM - 3:00 PM (PST)</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Where:</td>
            <td style="padding: 8px;">Conference Room A / Zoom (hybrid)</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Organizer:</td>
            <td style="padding: 8px;">calendar@company.com</td>
          </tr>
        </table>
        <h3>Agenda:</h3>
        <ul>
          <li>Q1 Review and Analysis</li>
          <li>Q2 Goals and Initiatives</li>
          <li>Resource Allocation</li>
          <li>Key Milestones and Deadlines</li>
        </ul>
        <p>Please review the attached calendar invite (.ics file) to add this to your calendar.</p>
      </div>
    `,
    text: "📅 Meeting Invitation\n\nEvent: Quarterly Planning Meeting\nWhen: Thursday, March 21, 2024 at 2:00 PM - 3:00 PM (PST)\nWhere: Conference Room A / Zoom (hybrid)\nOrganizer: calendar@company.com\n\nAgenda:\n- Q1 Review and Analysis\n- Q2 Goals and Initiatives\n- Resource Allocation\n- Key Milestones and Deadlines\n\nPlease review the attached calendar invite (.ics file) to add this to your calendar."
  },
  "011": {
    html: `
      <p>Hello,</p>
      <p>Thank you for contacting support. We've investigated the login issue and found the cause.</p>
      <h3>Issue:</h3>
      <p>Your session cookies were corrupted, preventing successful authentication.</p>
      <h3>Resolution:</h3>
      <ol>
        <li>Clear your browser cache and cookies</li>
        <li>Close all browser windows</li>
        <li>Restart your browser</li>
        <li>Try logging in again</li>
      </ol>
      <p>If the issue persists, please reply to this email with:</p>
      <ul>
        <li>Browser type and version</li>
        <li>Operating system</li>
        <li>Screenshot of any error messages</li>
      </ul>
      <p>We're here to help!</p>
      <p>Support Team<br>
      Ticket #1234</p>
    `,
    text: "Hello,\n\nThank you for contacting support. We've investigated the login issue and found the cause.\n\nIssue:\nYour session cookies were corrupted, preventing successful authentication.\n\nResolution:\n1. Clear your browser cache and cookies\n2. Close all browser windows\n3. Restart your browser\n4. Try logging in again\n\nIf the issue persists, please reply to this email with:\n- Browser type and version\n- Operating system\n- Screenshot of any error messages\n\nWe're here to help!\n\nSupport Team\nTicket #1234"
  },
  "012": {
    html: `
      <h2>🎉 Q1 Sales Report - Record Breaking Quarter!</h2>
      <p>Excited to share that we've exceeded our Q1 targets by <strong>23%</strong>!</p>
      <h3>Key Metrics:</h3>
      <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <tr style="background: #f5f5f5;">
          <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Metric</th>
          <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Target</th>
          <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Actual</th>
          <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Variance</th>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #ddd;">Revenue</td>
          <td style="padding: 12px; text-align: right; border: 1px solid #ddd;">$5.0M</td>
          <td style="padding: 12px; text-align: right; border: 1px solid #ddd;">$6.15M</td>
          <td style="padding: 12px; text-align: right; border: 1px solid #ddd; color: green;">+23%</td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #ddd;">New Customers</td>
          <td style="padding: 12px; text-align: right; border: 1px solid #ddd;">150</td>
          <td style="padding: 12px; text-align: right; border: 1px solid #ddd;">187</td>
          <td style="padding: 12px; text-align: right; border: 1px solid #ddd; color: green;">+25%</td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #ddd;">Avg Deal Size</td>
          <td style="padding: 12px; text-align: right; border: 1px solid #ddd;">$33k</td>
          <td style="padding: 12px; text-align: right; border: 1px solid #ddd;">$38k</td>
          <td style="padding: 12px; text-align: right; border: 1px solid #ddd; color: green;">+15%</td>
        </tr>
      </table>
      <p>See attached files for full regional breakdown and detailed analysis.</p>
      <p>Congratulations to the entire team on this outstanding performance!</p>
      <p>Sales Team</p>
    `,
    text: "🎉 Q1 Sales Report - Record Breaking Quarter!\n\nExcited to share that we've exceeded our Q1 targets by 23%!\n\nKey Metrics:\n- Revenue: $6.15M (target: $5.0M) +23%\n- New Customers: 187 (target: 150) +25%\n- Avg Deal Size: $38k (target: $33k) +15%\n\nSee attached files for full regional breakdown and detailed analysis.\n\nCongratulations to the entire team on this outstanding performance!\n\nSales Team"
  },
  "013": {
    html: `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; font-family: Arial, sans-serif;">
        <h1 style="margin: 0 0 16px 0; font-size: 36px;">Don't Miss Out!</h1>
        <h2 style="margin: 0 0 24px 0; font-weight: normal;">50% Off Premium Plans</h2>
        <p style="font-size: 18px; margin: 0 0 32px 0;">Limited time offer: Upgrade to Premium and save 50%</p>
        <a href="https://example.com/upgrade" style="background: white; color: #667eea; padding: 16px 32px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 18px; display: inline-block;">Upgrade Now</a>
        <p style="margin: 32px 0 0 0; font-size: 14px; opacity: 0.9;">Offer expires March 13th</p>
        <img src="https://example.com/promo-banner.png" alt="Premium Features">
      </div>
    `,
    text: "Don't Miss Out! 50% Off Premium Plans\n\nLimited time offer: Upgrade to Premium and save 50%\n\nOffer expires March 13th\n\nUpgrade Now: https://example.com/upgrade"
  },
  "014": {
    html: `
      <p><strong>Scheduled Maintenance Notice</strong></p>
      <p>Please be advised that we will be performing network infrastructure upgrades on:</p>
      <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 18px;"><strong>Sunday, March 17th, 2024</strong></p>
        <p style="margin: 8px 0 0 0; font-size: 18px;"><strong>2:00 AM - 6:00 AM (PST)</strong></p>
      </div>
      <h3>Impact:</h3>
      <p>All systems will be unavailable during this maintenance window, including:</p>
      <ul>
        <li>Email services</li>
        <li>File storage and sharing</li>
        <li>Internal applications</li>
        <li>VPN access</li>
      </ul>
      <h3>What to expect:</h3>
      <ul>
        <li>Complete network downtime for the 4-hour window</li>
        <li>No remote access available</li>
        <li>Office will remain accessible for on-site work</li>
      </ul>
      <p>We apologize for any inconvenience. This upgrade will significantly improve network performance and reliability.</p>
      <p>Questions? Contact IT Department: it@company.com</p>
    `,
    text: "Scheduled Maintenance Notice\n\nPlease be advised that we will be performing network infrastructure upgrades on:\n\nSunday, March 17th, 2024\n2:00 AM - 6:00 AM (PST)\n\nImpact:\nAll systems will be unavailable during this maintenance window, including:\n- Email services\n- File storage and sharing\n- Internal applications\n- VPN access\n\nWhat to expect:\n- Complete network downtime for the 4-hour window\n- No remote access available\n- Office will remain accessible for on-site work\n\nWe apologize for any inconvenience. This upgrade will significantly improve network performance and reliability.\n\nQuestions? Contact IT Department: it@company.com"
  },
  "015": {
    html: `
      <p>Dear Procurement Team,</p>
      <p>Thank you for your interest in our enterprise solutions. Attached is our proposal for a 3-year licensing agreement with volume discounts.</p>
      <h3>Proposal Highlights:</h3>
      <ul>
        <li><strong>Licensing Model:</strong> Per-user subscription with unlimited deployment</li>
        <li><strong>Term:</strong> 3 years with option to renew</li>
        <li><strong>Volume Discount:</strong> 30% off standard pricing for 500+ users</li>
        <li><strong>Support:</strong> 24/7 premium support included</li>
        <li><strong>Training:</strong> Complimentary onboarding for up to 50 administrators</li>
      </ul>
      <h3>Pricing Summary:</h3>
      <p>Year 1: $450,000 (includes implementation)<br>
      Year 2: $380,000 (annual subscription)<br>
      Year 3: $380,000 (annual subscription)</p>
      <p><strong>Total 3-Year Investment: $1,210,000</strong> (saves $520,000 vs. monthly billing)</p>
      <p>Detailed pricing breakdown and technical specifications are in the attached documents.</p>
      <p>I'm available to discuss this proposal at your convenience. Please let me know if you have any questions or would like to schedule a call.</p>
      <p>Best regards,</p>
      <p>Carlos Garcia<br>
      Enterprise Sales Manager<br>
      carlos@vendor.com<br>
      (555) 123-4567</p>
    `,
    text: "Dear Procurement Team,\n\nThank you for your interest in our enterprise solutions. Attached is our proposal for a 3-year licensing agreement with volume discounts.\n\nProposal Highlights:\n- Licensing Model: Per-user subscription with unlimited deployment\n- Term: 3 years with option to renew\n- Volume Discount: 30% off standard pricing for 500+ users\n- Support: 24/7 premium support included\n- Training: Complimentary onboarding for up to 50 administrators\n\nPricing Summary:\nYear 1: $450,000 (includes implementation)\nYear 2: $380,000 (annual subscription)\nYear 3: $380,000 (annual subscription)\n\nTotal 3-Year Investment: $1,210,000 (saves $520,000 vs. monthly billing)\n\nDetailed pricing breakdown and technical specifications are in the attached documents.\n\nI'm available to discuss this proposal at your convenience. Please let me know if you have any questions or would like to schedule a call.\n\nBest regards,\n\nCarlos Garcia\nEnterprise Sales Manager\ncarlos@vendor.com\n(555) 123-4567"
  }
};
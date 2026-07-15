import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://navymentor.ng';
const LOGO_URL = `${APP_URL}/assets/nigerian-navy-logo.png`;
const BANNER_URL = `${APP_URL}/assets/fleet-at-sea.jpg`;

export const mailer = {
  /**
   * Sends a beautiful Welcome Email when a new user registers.
   */
  async sendWelcomeEmail(to: string, fullName: string, role: string) {
    const roleLabel = role === 'active_mentor' ? 'Active Mentor' 
                    : role === 'retired_mentor' ? 'Retired Mentor' 
                    : 'Mentee';
                    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to the Nigerian Navy Mentorship Platform</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f6f8fb; color: #1e293b; }
          .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background-color: #071932; padding: 30px; text-align: center; border-bottom: 4px solid #c5a880; }
          .logo { width: 80px; height: 80px; margin-bottom: 15px; }
          .header-title { color: #ffffff; font-size: 22px; font-weight: bold; margin: 0; letter-spacing: 0.5px; }
          .banner { width: 100%; height: 200px; object-fit: cover; }
          .content { padding: 40px 30px; line-height: 1.6; }
          .greeting { font-size: 18px; font-weight: bold; margin-bottom: 20px; color: #071932; }
          .badge { display: inline-block; background-color: #c5a880; color: #071932; font-size: 11px; font-weight: bold; text-transform: uppercase; padding: 4px 10px; border-radius: 4px; margin-bottom: 20px; letter-spacing: 0.5px; }
          .text { font-size: 14px; color: #475569; margin-bottom: 25px; }
          .footer { background-color: #f8fafc; padding: 20px 30px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; }
          .btn { display: inline-block; background-color: #071932; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 14px; margin-top: 10px; border: 1px solid #c5a880; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${LOGO_URL}" alt="Nigerian Navy Logo" class="logo" />
            <h1 class="header-title">NIGERIAN NAVY MENTORSHIP</h1>
          </div>
          <img src="${BANNER_URL}" alt="Naval Fleet at Sea" class="banner" />
          <div class="content">
            <div class="greeting">Greetings, Officer ${fullName}</div>
            <div class="badge">ROLE: ${roleLabel}</div>
            <p class="text">
              Welcome to the institutional-grade mentorship platform of the Nigerian Navy. We are honored to have you join our network dedicated to leadership preservation, watchkeeping excellence, and maritime operational safety.
            </p>
            <p class="text">
              <strong>Account Verification:</strong> To maintain the safety and integrity of active naval operations, your account is currently pending manual vetting. The administrator will review your service credentials and uploaded discharge documentation shortly. You will be notified immediately upon approval.
            </p>
            <div style="text-align: center;">
              <a href="${APP_URL}/login" class="btn" style="color: #ffffff;">Access Portal</a>
            </div>
          </div>
          <div class="footer">
            © 2026 Nigerian Navy Headquarters. Authorized and Restricted Access Only.
          </div>
        </div>
      </body>
      </html>
    `;

    return resend.emails.send({
      from: 'Nigerian Navy Mentorship <onboarding@navymentor.ng>',
      to: [to],
      subject: 'Welcome to the Nigerian Navy Mentorship Platform',
      html,
    });
  },

  /**
   * Sends a password recovery email with a custom reset button.
   */
  async sendResetPasswordEmail(to: string, resetUrl: string) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f6f8fb; color: #1e293b; }
          .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background-color: #071932; padding: 25px; text-align: center; border-bottom: 4px solid #c5a880; }
          .logo { width: 60px; height: 60px; }
          .content { padding: 40px 30px; line-height: 1.6; }
          .title { font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #071932; text-align: center; }
          .text { font-size: 14px; color: #475569; margin-bottom: 25px; }
          .btn-container { text-align: center; margin: 30px 0; }
          .btn { display: inline-block; background-color: #071932; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 14px; border: 1px solid #c5a880; }
          .footer { background-color: #f8fafc; padding: 20px 30px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${LOGO_URL}" alt="Nigerian Navy Logo" class="logo" />
          </div>
          <div class="content">
            <h2 class="title">Reset Your Access Password</h2>
            <p class="text">
              We received a request to reset the password for your account on the Nigerian Navy Mentorship Platform. Click the button below to establish a new password. This recovery link is valid for 1 hour.
            </p>
            <div class="btn-container">
              <a href="${resetUrl}" class="btn" style="color: #ffffff;">Reset Password</a>
            </div>
            <p class="text" style="font-size: 12px; color: #94a3b8;">
              If you did not initiate this request, please disregard this email or report it to naval command administration if you suspect unauthorized activity.
            </p>
          </div>
          <div class="footer">
            © 2026 Nigerian Navy Headquarters. Secure Communication Protocol.
          </div>
        </div>
      </body>
      </html>
    `;

    return resend.emails.send({
      from: 'Nigerian Navy Security <security@navymentor.ng>',
      to: [to],
      subject: 'Reset Your Password — Nigerian Navy Mentorship',
      html,
    });
  },

  /**
   * Broadcasts an event publication email to multiple registered users.
   */
  async sendEventPublishedEmail(emails: string[], eventTitle: string, eventDesc: string, eventDate: string, eventLink?: string) {
    const formattedDate = new Date(eventDate).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Event Announcement</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f6f8fb; color: #1e293b; }
          .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background-color: #071932; padding: 25px; text-align: center; border-bottom: 4px solid #c5a880; }
          .logo { width: 60px; height: 60px; }
          .content { padding: 40px 30px; line-height: 1.6; }
          .title { font-size: 20px; font-weight: bold; margin-bottom: 5px; color: #071932; text-align: center; }
          .subtitle { font-size: 12px; color: #c5a880; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; text-align: center; margin-bottom: 25px; }
          .event-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin-bottom: 25px; }
          .event-title { font-size: 16px; font-weight: bold; color: #071932; margin-top: 0; margin-bottom: 10px; }
          .event-meta { font-size: 13px; color: #64748b; margin-bottom: 15px; }
          .event-desc { font-size: 14px; color: #475569; margin: 0; }
          .btn-container { text-align: center; margin-top: 15px; }
          .btn { display: inline-block; background-color: #071932; color: #ffffff !important; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-weight: bold; font-size: 13px; border: 1px solid #c5a880; }
          .footer { background-color: #f8fafc; padding: 20px 30px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${LOGO_URL}" alt="Nigerian Navy Logo" class="logo" />
          </div>
          <div class="content">
            <h2 class="title">Naval Broadside Announcement</h2>
            <div class="subtitle">New Event Published</div>
            <div class="event-card">
              <h3 class="event-title">${eventTitle}</h3>
              <div class="event-meta">
                <strong>Schedule:</strong> ${formattedDate}
              </div>
              <p class="event-desc">${eventDesc}</p>
              ${eventLink ? `
                <div class="btn-container">
                  <a href="${eventLink}" class="btn" style="color: #ffffff;">Join Meeting / Event</a>
                </div>
              ` : ''}
            </div>
            <p class="text" style="font-size: 12px; color: #64748b; text-align: center;">
              Login to your mentorship portal dashboard to register for this event.
            </p>
          </div>
          <div class="footer">
            © 2026 Nigerian Navy Headquarters. Authorized Broadcast.
          </div>
        </div>
      </body>
      </html>
    `;

    // Resend allows batch sending by sending up to 100 emails in a single request,
    // or using standard loop depending on size. We will send to all emails as BCC
    // or split into chunks of 100 to ensure high delivery rate and prevent disclosing user emails.
    return resend.emails.send({
      from: 'Nigerian Navy Headquaters <announcements@navymentor.ng>',
      to: ['broadcast@navymentor.ng'], // Dummy receiver
      bcc: emails,                     // Hides recipient list from each other
      subject: `New Event: ${eventTitle} — Nigerian Navy Mentorship`,
      html,
    });
  },

  /**
   * Sends an RSVP confirmation email when a user registers for an event.
   */
  async sendEventRegistrationEmail(to: string, fullName: string, eventTitle: string, eventDate: string, rsvpStatus: string, eventLink?: string) {
    const formattedDate = new Date(eventDate).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const statusText = rsvpStatus === 'attending' ? 'Attending (Confirmed)'
                     : rsvpStatus === 'interested' ? 'Interested'
                     : 'Declined';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Event RSVP Confirmation</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f6f8fb; color: #1e293b; }
          .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background-color: #071932; padding: 25px; text-align: center; border-bottom: 4px solid #c5a880; }
          .logo { width: 60px; height: 60px; }
          .content { padding: 40px 30px; line-height: 1.6; }
          .title { font-size: 20px; font-weight: bold; margin-bottom: 5px; color: #071932; text-align: center; }
          .subtitle { font-size: 12px; color: #c5a880; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; text-align: center; margin-bottom: 25px; }
          .event-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin-bottom: 25px; }
          .event-title { font-size: 16px; font-weight: bold; color: #071932; margin-top: 0; margin-bottom: 10px; }
          .event-meta { font-size: 13px; color: #64748b; margin-bottom: 15px; }
          .event-desc { font-size: 14px; color: #475569; margin: 0; }
          .status-badge { display: inline-block; background-color: ${rsvpStatus === 'attending' ? '#dcfce7' : rsvpStatus === 'interested' ? '#fef9c3' : '#fee2e2'}; color: ${rsvpStatus === 'attending' ? '#166534' : rsvpStatus === 'interested' ? '#854d0e' : '#991b1b'}; font-size: 12px; font-weight: bold; padding: 6px 12px; border-radius: 4px; margin-bottom: 15px; }
          .btn-container { text-align: center; margin-top: 15px; }
          .btn { display: inline-block; background-color: #071932; color: #ffffff !important; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-weight: bold; font-size: 13px; border: 1px solid #c5a880; }
          .footer { background-color: #f8fafc; padding: 20px 30px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${LOGO_URL}" alt="Nigerian Navy Logo" class="logo" />
          </div>
          <div class="content">
            <h2 class="title">Event Registration Updated</h2>
            <div class="subtitle">RSVP Receipt</div>
            <p class="greeting" style="font-size: 15px; font-weight: bold; color: #071932;">Hello, ${fullName}</p>
            <p class="text" style="font-size: 14px; color: #475569;">
              You have successfully updated your registration status for the following mentorship training session:
            </p>
            <div class="event-card">
              <div class="status-badge">RSVP Status: ${statusText}</div>
              <h3 class="event-title">${eventTitle}</h3>
              <div class="event-meta">
                <strong>Schedule:</strong> ${formattedDate}
              </div>
              ${eventLink && rsvpStatus === 'attending' ? `
                <div class="btn-container">
                  <a href="${eventLink}" class="btn" style="color: #ffffff;">Access Meeting Link</a>
                </div>
              ` : ''}
            </div>
            <p class="text" style="font-size: 12px; color: #64748b; text-align: center;">
              You can adjust your RSVP settings at any time from your platform dashboard.
            </p>
          </div>
          <div class="footer">
            © 2026 Nigerian Navy Headquarters. Secure Mentorship Platform.
          </div>
        </div>
      </body>
      </html>
    `;

    return resend.emails.send({
      from: 'Nigerian Navy Mentorship <events@navymentor.ng>',
      to: [to],
      subject: `RSVP Confirmation: ${eventTitle} — ${statusText}`,
      html,
    });
  }
};

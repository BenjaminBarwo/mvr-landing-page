import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Hr,
} from '@react-email/components'

interface WaitlistApprovedEmailProps {
  firstName: string
  role: string
  zip: string
}

const bodyStyle = {
  backgroundColor: '#f2f3f5',
  margin: '0',
  padding: '24px 0',
}

const containerStyle = {
  maxWidth: '600px',
  margin: '0 auto',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
}

const cardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  padding: '40px',
  margin: '0 auto',
}

const badgeStyle = {
  display: 'inline-block',
  backgroundColor: '#222222',
  color: '#ffffff',
  borderRadius: '4px',
  padding: '4px 10px',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 24px 0',
}

const headingStyle = {
  color: '#222222',
  fontSize: '26px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 16px 0',
}

const subheadingStyle = {
  color: '#222222',
  fontSize: '18px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '24px 0 8px 0',
}

const textStyle = {
  color: '#444444',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
}

const seatBoxStyle = {
  backgroundColor: '#f8f9fa',
  borderRadius: '6px',
  padding: '20px',
  margin: '24px 0',
  borderLeft: '3px solid #222222',
}

const valueStyle = {
  color: '#444444',
  fontSize: '16px',
  margin: '0 0 8px 0',
}

const hrStyle = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
}

const footerTextStyle = {
  color: '#888888',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
}

function formatRole(role: string): string {
  return role
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function WaitlistApprovedEmail({ firstName, role, zip }: WaitlistApprovedEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <div style={cardStyle}>
            <div style={badgeStyle}>MVR — Seat Opened</div>

            <Heading style={headingStyle}>
              Great News — A Seat Has Opened
            </Heading>

            <Text style={textStyle}>
              Hi {firstName},
            </Text>

            <Text style={textStyle}>
              We promised we&apos;d reach out when something opened in your territory — and it did. A founding seat just became available for the {formatRole(role)} role in ZIP {zip}.
            </Text>

            <div style={seatBoxStyle}>
              <Text style={{ ...valueStyle, fontWeight: '600', margin: '0 0 12px 0' }}>Your Seat — Available Now</Text>
              <Text style={valueStyle}><strong>Role:</strong> {formatRole(role)}</Text>
              <Text style={valueStyle}><strong>Territory:</strong> ZIP {zip}</Text>
              <Text style={{ ...valueStyle, margin: '0' }}><strong>Held for you:</strong> 48 hours from this email</Text>
            </div>

            <Text style={textStyle}>
              Your $100 activation credit will be applied to your first live month — nothing additional to pay right now. We&apos;ll finalize your seat and send onboarding details.
            </Text>

            <Text style={subheadingStyle}>Next steps</Text>

            <Text style={textStyle}>
              Reply to this email to confirm you&apos;d like to proceed — we&apos;ll lock in your seat and move you through onboarding ahead of platform launch. If we don&apos;t hear back within 48 hours, we&apos;ll offer the seat to the next person on the waitlist.
            </Text>

            <Hr style={hrStyle} />

            <Text style={footerTextStyle}>
              Questions? Just reply to this email.
            </Text>
          </div>
        </Container>
      </Body>
    </Html>
  )
}

WaitlistApprovedEmail.PreviewProps = {
  firstName: 'Alex',
  role: 'title_company',
  zip: '77401',
} satisfies WaitlistApprovedEmailProps

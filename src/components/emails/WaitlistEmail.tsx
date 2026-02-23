import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Hr,
} from '@react-email/components'

interface WaitlistEmailProps {
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
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 16px 0',
}

const textStyle = {
  color: '#444444',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
}

const detailsBoxStyle = {
  backgroundColor: '#f8f9fa',
  borderRadius: '6px',
  padding: '20px',
  margin: '24px 0',
}

const valueStyle = {
  color: '#444444',
  fontSize: '15px',
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

export function WaitlistEmail({ firstName, role, zip }: WaitlistEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <div style={cardStyle}>
            <div style={badgeStyle}>MVR — Waitlist</div>

            <Heading style={headingStyle}>
              You&apos;re on the Waitlist
            </Heading>

            <Text style={textStyle}>
              Hi {firstName},
            </Text>

            <Text style={textStyle}>
              We&apos;ve been going through applications personally — and yours stood out. We&apos;ve placed you on the waitlist for the {formatRole(role)} seat in ZIP {zip}.
            </Text>

            <Text style={textStyle}>
              Here&apos;s the honest picture: that seat is currently filled, but founding cohorts are never fully locked in until onboarding begins. We actively work our waitlist. When something opens up in your territory, we reach out directly — this isn&apos;t an automated queue.
            </Text>

            <div style={detailsBoxStyle}>
              <Text style={{ ...valueStyle, fontWeight: '600', margin: '0 0 12px 0' }}>What this means for you</Text>
              <Text style={valueStyle}>Your $100 activation credit is held as a deposit — it&apos;s not charged until your seat is confirmed.</Text>
              <Text style={{ ...valueStyle, margin: '0' }}>When a seat opens in your territory, we&apos;ll email you directly and hold it for 48 hours before offering it to the next person.</Text>
            </div>

            <Text style={textStyle}>
              We appreciate that you took the time to apply and that you&apos;re serious about your market. That&apos;s exactly the kind of professional we want in founding seats.
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

WaitlistEmail.PreviewProps = {
  firstName: 'Jordan',
  role: 'inspector',
  zip: '77056',
} satisfies WaitlistEmailProps

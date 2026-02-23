import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Hr,
} from '@react-email/components'

interface ApprovalEmailProps {
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

const detailsBoxStyle = {
  backgroundColor: '#f8f9fa',
  borderRadius: '6px',
  padding: '20px',
  margin: '24px 0',
}

const valueStyle = {
  color: '#444444',
  fontSize: '16px',
  margin: '0 0 12px 0',
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

export function ApprovalEmail({ firstName, role, zip }: ApprovalEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <div style={cardStyle}>
            <div style={badgeStyle}>MVR Founding Seat — Confirmed</div>

            <Heading style={headingStyle}>
              You&apos;ve Secured Your Founding Seat
            </Heading>

            <Text style={textStyle}>
              Hi {firstName},
            </Text>

            <Text style={textStyle}>
              Congratulations — you&apos;ve secured your founding seat for the {formatRole(role)} role in ZIP {zip}. We&apos;re genuinely excited to have you in this first cohort.
            </Text>

            <div style={detailsBoxStyle}>
              <Text style={{ ...valueStyle, fontWeight: '600', margin: '0 0 8px 0' }}>Your Founding Seat</Text>
              <Text style={valueStyle}><strong>Role:</strong> {formatRole(role)}</Text>
              <Text style={valueStyle}><strong>Territory:</strong> ZIP {zip}</Text>
              <Text style={{ ...valueStyle, margin: '0' }}><strong>Status:</strong> Confirmed</Text>
            </div>

            <Text style={subheadingStyle}>What to expect</Text>

            <Text style={textStyle}>
              We&apos;re finalizing platform launch details and will be in touch with your onboarding timeline. As a founding member, you&apos;ll have input on features, pricing, and how the platform evolves for your market.
            </Text>

            <Text style={textStyle}>
              Your $100 activation credit will be applied to your first live month. There&apos;s nothing else you need to do right now — we&apos;ll reach out with next steps as we approach launch.
            </Text>

            <Text style={subheadingStyle}>In the meantime</Text>

            <Text style={textStyle}>
              If there&apos;s a colleague in your market who should know about founding seats before they&apos;re gone, feel free to pass this along. We&apos;re keeping the cohort intentionally small.
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

ApprovalEmail.PreviewProps = {
  firstName: 'Marcus',
  role: 'lender',
  zip: '77005',
} satisfies ApprovalEmailProps

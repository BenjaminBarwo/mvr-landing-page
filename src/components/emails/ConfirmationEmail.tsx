import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Hr,
} from '@react-email/components'

interface ConfirmationEmailProps {
  firstName: string
  role: string
  zip: string
  amountPaid: string
}

const containerStyle = {
  maxWidth: '600px',
  margin: '0 auto',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
}

const bodyStyle = {
  backgroundColor: '#f2f3f5',
  margin: '0',
  padding: '24px 0',
}

const cardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  padding: '40px',
  margin: '0 auto',
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

const labelStyle = {
  color: '#222222',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 4px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
}

const valueStyle = {
  color: '#444444',
  fontSize: '16px',
  margin: '0 0 12px 0',
}

const detailsBoxStyle = {
  backgroundColor: '#f8f9fa',
  borderRadius: '6px',
  padding: '20px',
  margin: '24px 0',
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

function formatRole(role: string): string {
  return role
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function ConfirmationEmail({ firstName, role, zip, amountPaid }: ConfirmationEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <div style={cardStyle}>
            <div style={badgeStyle}>MVR Founding Seat</div>

            <Heading style={headingStyle}>
              Application Received
            </Heading>

            <Text style={textStyle}>
              Hi {firstName},
            </Text>

            <Text style={textStyle}>
              We&apos;ve received your founding seat application for the {formatRole(role)} role in ZIP {zip}.
              Your {amountPaid} activation credit has been received and will be applied to your first live month on the platform.
            </Text>

            <div style={detailsBoxStyle}>
              <Text style={labelStyle}>Application Details</Text>
              <Text style={valueStyle}><strong>Role:</strong> {formatRole(role)}</Text>
              <Text style={valueStyle}><strong>Territory:</strong> ZIP {zip}</Text>
              <Text style={valueStyle}><strong>Activation Credit:</strong> {amountPaid}</Text>
            </div>

            <Text style={{ ...textStyle, fontWeight: '600', margin: '24px 0 8px 0' }}>
              What happens next
            </Text>

            <Text style={textStyle}>
              Our team personally reviews every application within 48 hours. We look at your territory, role, and how it fits the current cohort of founding seats in your market.
            </Text>

            <Text style={textStyle}>
              You&apos;ll hear from us directly with one of three outcomes: approved (founding seat confirmed), waitlisted (we&apos;ll reach out when a seat opens), or not accepted (activation credit refunded within 5–10 business days).
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

ConfirmationEmail.PreviewProps = {
  firstName: 'Sarah',
  role: 'agent',
  zip: '77002',
  amountPaid: '$100',
} satisfies ConfirmationEmailProps

import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Hr,
} from '@react-email/components'

interface RejectionEmailProps {
  firstName: string
  role: string
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

const refundBoxStyle = {
  backgroundColor: '#f8f9fa',
  borderRadius: '6px',
  padding: '20px',
  margin: '24px 0',
}

const refundTextStyle = {
  color: '#444444',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
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

export function RejectionEmail({ firstName, role }: RejectionEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <div style={cardStyle}>
            <div style={badgeStyle}>MVR — Application Update</div>

            <Heading style={headingStyle}>
              Update on Your MVR Application
            </Heading>

            <Text style={textStyle}>
              Hi {firstName},
            </Text>

            <Text style={textStyle}>
              Thank you for your interest in an MVR founding seat for the {formatRole(role)} role. After careful review, we&apos;re not able to move forward with your application at this time.
            </Text>

            <Text style={textStyle}>
              This decision reflects the current composition of founding members in your market and territory — it&apos;s not a reflection of you or your qualifications as a professional.
            </Text>

            <div style={refundBoxStyle}>
              <Text style={refundTextStyle}>
                <strong>Your $100 activation credit will be fully refunded</strong> to your original payment method within 5–10 business days.
              </Text>
            </div>

            <Text style={textStyle}>
              MVR is growing market by market. As we expand, there may be future opportunities for founding seats in your area — we&apos;d genuinely welcome a conversation when that happens.
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

RejectionEmail.PreviewProps = {
  firstName: 'David',
  role: 'agent',
} satisfies RejectionEmailProps

import {
  Heading,
  Text,
  Hr,
} from '@react-email/components'
import { EmailLayout } from './EmailLayout'

interface RejectionEmailProps {
  firstName: string
  role: string
}

const headingStyle = {
  color: '#222222',
  fontSize: '28px',
  fontWeight: '300',
  letterSpacing: '-0.8px',
  lineHeight: '1.4',
  margin: '0 0 24px 0',
}

const textStyle = {
  color: '#444444',
  fontSize: '15px',
  fontWeight: '300' as const,
  lineHeight: '1.7',
  letterSpacing: '-0.2px',
  margin: '0 0 16px 0',
}

const refundBoxStyle = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px 24px',
  margin: '28px 0',
}

const refundTextStyle = {
  color: '#444444',
  fontSize: '14px',
  fontWeight: '300' as const,
  lineHeight: '1.7',
  margin: '0',
}

const hrStyle = {
  borderColor: '#eeeeee',
  margin: '32px 0',
}

const footerTextStyle = {
  color: '#999999',
  fontSize: '13px',
  fontWeight: '300' as const,
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
    <EmailLayout>
      <Heading style={headingStyle}>
        Update on your application
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
    </EmailLayout>
  )
}

RejectionEmail.PreviewProps = {
  firstName: 'David',
  role: 'agent',
} satisfies RejectionEmailProps

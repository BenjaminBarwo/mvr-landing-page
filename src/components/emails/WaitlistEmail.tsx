import {
  Heading,
  Text,
  Hr,
} from '@react-email/components'
import { EmailLayout } from './EmailLayout'

interface WaitlistEmailProps {
  firstName: string
  role: string
  zip: string
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

const detailsBoxStyle = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px 24px',
  margin: '28px 0',
}

const detailLabelStyle = {
  color: '#999999',
  fontSize: '11px',
  fontWeight: '400' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  margin: '0 0 12px 0',
}

const detailRowStyle = {
  color: '#444444',
  fontSize: '14px',
  fontWeight: '300' as const,
  lineHeight: '1.7',
  margin: '0 0 6px 0',
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

export function WaitlistEmail({ firstName, role, zip }: WaitlistEmailProps) {
  return (
    <EmailLayout>
      <Heading style={headingStyle}>
        You&apos;re on the waitlist
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
        <Text style={detailLabelStyle}>What this means for you</Text>
        <Text style={detailRowStyle}>Your $100 activation credit is held as a deposit — it&apos;s not charged until your seat is confirmed.</Text>
        <Text style={{ ...detailRowStyle, margin: '0' }}>When a seat opens in your territory, we&apos;ll email you directly and hold it for 48 hours before offering it to the next person.</Text>
      </div>

      <Text style={textStyle}>
        We appreciate that you took the time to apply and that you&apos;re serious about your market. That&apos;s exactly the kind of professional we want in founding seats.
      </Text>

      <Hr style={hrStyle} />

      <Text style={footerTextStyle}>
        Questions? Just reply to this email.
      </Text>
    </EmailLayout>
  )
}

WaitlistEmail.PreviewProps = {
  firstName: 'Jordan',
  role: 'inspector',
  zip: '77056',
} satisfies WaitlistEmailProps

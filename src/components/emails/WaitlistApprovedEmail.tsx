import {
  Heading,
  Text,
  Hr,
} from '@react-email/components'
import { EmailLayout } from './EmailLayout'

interface WaitlistApprovedEmailProps {
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

const subheadingStyle = {
  color: '#222222',
  fontSize: '15px',
  fontWeight: '500' as const,
  letterSpacing: '-0.2px',
  margin: '28px 0 8px 0',
}

const textStyle = {
  color: '#444444',
  fontSize: '15px',
  fontWeight: '300' as const,
  lineHeight: '1.7',
  letterSpacing: '-0.2px',
  margin: '0 0 16px 0',
}

const seatBoxStyle = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px 24px',
  margin: '28px 0',
  borderLeft: '3px solid #222222',
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
  lineHeight: '1.5',
  margin: '0 0 8px 0',
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

export function WaitlistApprovedEmail({ firstName, role, zip }: WaitlistApprovedEmailProps) {
  return (
    <EmailLayout>
      <Heading style={headingStyle}>
        A seat has opened
      </Heading>

      <Text style={textStyle}>
        Hi {firstName},
      </Text>

      <Text style={textStyle}>
        We promised we&apos;d reach out when something opened in your territory — and it did. A founding seat just became available for the {formatRole(role)} role in ZIP {zip}.
      </Text>

      <div style={seatBoxStyle}>
        <Text style={detailLabelStyle}>Your seat — available now</Text>
        <Text style={detailRowStyle}><strong>Role</strong> &nbsp;&mdash;&nbsp; {formatRole(role)}</Text>
        <Text style={detailRowStyle}><strong>Territory</strong> &nbsp;&mdash;&nbsp; ZIP {zip}</Text>
        <Text style={{ ...detailRowStyle, margin: '0' }}><strong>Held for you</strong> &nbsp;&mdash;&nbsp; 48 hours from this email</Text>
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
    </EmailLayout>
  )
}

WaitlistApprovedEmail.PreviewProps = {
  firstName: 'Alex',
  role: 'title_company',
  zip: '77401',
} satisfies WaitlistApprovedEmailProps

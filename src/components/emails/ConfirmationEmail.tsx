import {
  Heading,
  Text,
  Hr,
} from '@react-email/components'
import { EmailLayout } from './EmailLayout'

interface ConfirmationEmailProps {
  firstName: string
  role: string
  zip: string
  amountPaid: string
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
  lineHeight: '1.5',
  margin: '0 0 8px 0',
}

const subheadingStyle = {
  color: '#222222',
  fontSize: '15px',
  fontWeight: '500' as const,
  letterSpacing: '-0.2px',
  margin: '28px 0 8px 0',
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

export function ConfirmationEmail({ firstName, role, zip, amountPaid }: ConfirmationEmailProps) {
  return (
    <EmailLayout>
      <Heading style={headingStyle}>
        Application received
      </Heading>

      <Text style={textStyle}>
        Hi {firstName},
      </Text>

      <Text style={textStyle}>
        We&apos;ve received your founding seat application for the {formatRole(role)} role in ZIP {zip}.
        Your {amountPaid} activation credit has been received and will be applied to your first live month on the platform.
      </Text>

      <div style={detailsBoxStyle}>
        <Text style={detailLabelStyle}>Application details</Text>
        <Text style={detailRowStyle}><strong>Role</strong> &nbsp;&mdash;&nbsp; {formatRole(role)}</Text>
        <Text style={detailRowStyle}><strong>Territory</strong> &nbsp;&mdash;&nbsp; ZIP {zip}</Text>
        <Text style={{ ...detailRowStyle, margin: '0' }}><strong>Credit</strong> &nbsp;&mdash;&nbsp; {amountPaid}</Text>
      </div>

      <Text style={subheadingStyle}>
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
    </EmailLayout>
  )
}

ConfirmationEmail.PreviewProps = {
  firstName: 'Sarah',
  role: 'agent',
  zip: '77002',
  amountPaid: '$100',
} satisfies ConfirmationEmailProps

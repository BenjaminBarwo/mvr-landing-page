import {
  Heading,
  Text,
  Hr,
} from '@react-email/components'
import { EmailLayout } from './EmailLayout'

interface ApprovalEmailProps {
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

export function ApprovalEmail({ firstName, role, zip }: ApprovalEmailProps) {
  return (
    <EmailLayout>
      <Heading style={headingStyle}>
        You&apos;ve secured your founding seat
      </Heading>

      <Text style={textStyle}>
        Hi {firstName},
      </Text>

      <Text style={textStyle}>
        Congratulations — you&apos;ve secured your founding seat for the {formatRole(role)} role in ZIP {zip}. We&apos;re genuinely excited to have you in the founding group.
      </Text>

      <div style={detailsBoxStyle}>
        <Text style={detailLabelStyle}>Your founding seat</Text>
        <Text style={detailRowStyle}><strong>Role</strong> &nbsp;&mdash;&nbsp; {formatRole(role)}</Text>
        <Text style={detailRowStyle}><strong>Territory</strong> &nbsp;&mdash;&nbsp; ZIP {zip}</Text>
        <Text style={{ ...detailRowStyle, margin: '0' }}><strong>Status</strong> &nbsp;&mdash;&nbsp; Confirmed</Text>
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
        If there&apos;s a colleague in your market who should know about founding seats before they&apos;re gone, feel free to pass this along. We&apos;re keeping the group intentionally small.
      </Text>

      <Hr style={hrStyle} />

      <Text style={footerTextStyle}>
        Questions? Just reply to this email.
      </Text>
    </EmailLayout>
  )
}

ApprovalEmail.PreviewProps = {
  firstName: 'Marcus',
  role: 'lender',
  zip: '77005',
} satisfies ApprovalEmailProps

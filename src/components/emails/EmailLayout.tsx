import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Link,
  Hr,
} from '@react-email/components'

interface EmailLayoutProps {
  children: React.ReactNode
}

const bodyStyle = {
  backgroundColor: '#f2f3f5',
  margin: '0',
  padding: '0',
}

const containerStyle = {
  maxWidth: '560px',
  margin: '0 auto',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  padding: '48px 0 40px',
}

const logoStyle = {
  fontSize: '28px',
  fontWeight: '300' as const,
  letterSpacing: '-1px',
  color: '#222222',
  textAlign: 'center' as const,
  margin: '0 0 32px 0',
}

const cardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '10px',
  padding: '44px 40px',
  margin: '0 auto',
}

const footerHrStyle = {
  borderColor: '#e0e0e0',
  margin: '0',
}

const footerStyle = {
  textAlign: 'center' as const,
  padding: '28px 0 0',
}

const footerTextStyle = {
  color: '#b0b0b0',
  fontSize: '12px',
  fontWeight: '300' as const,
  lineHeight: '1.7',
  letterSpacing: '-0.2px',
  margin: '0 0 4px 0',
}

const footerLinkStyle = {
  color: '#999999',
  textDecoration: 'none' as const,
}

export function EmailLayout({ children }: EmailLayoutProps) {
  return (
    <Html lang="en">
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Text style={logoStyle}>MVR.</Text>

          <div style={cardStyle}>
            {children}
          </div>

          <Hr style={footerHrStyle} />

          <div style={footerStyle}>
            <Text style={footerTextStyle}>
              <Link href="https://mvrfounding.com" style={footerLinkStyle}>
                mvrfounding.com
              </Link>
            </Text>
            <Text style={{ ...footerTextStyle, margin: '8px 0 0 0' }}>
              You received this email because you applied for an MVR founding seat.
            </Text>
          </div>
        </Container>
      </Body>
    </Html>
  )
}

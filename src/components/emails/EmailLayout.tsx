import {
  Html,
  Head,
  Body,
  Container,
  Img,
  Text,
  Link,
  Hr,
  Section,
} from '@react-email/components'

const BASE_URL = 'https://mvrfounding.com'

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

const headerStyle = {
  textAlign: 'center' as const,
  margin: '0 0 32px 0',
}

const logoImgStyle = {
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  margin: '0 auto 12px auto',
  display: 'block' as const,
}

const logoTextStyle = {
  fontSize: '20px',
  fontWeight: '600' as const,
  letterSpacing: '-0.5px',
  color: '#222222',
  textAlign: 'center' as const,
  margin: '0',
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

const pfpStyle = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  margin: '0 auto 8px auto',
  display: 'block' as const,
}

const footerNameStyle = {
  color: '#666666',
  fontSize: '13px',
  fontWeight: '500' as const,
  letterSpacing: '-0.2px',
  margin: '0 0 2px 0',
  textAlign: 'center' as const,
}

const footerRoleStyle = {
  color: '#999999',
  fontSize: '12px',
  fontWeight: '300' as const,
  letterSpacing: '-0.2px',
  margin: '0 0 16px 0',
  textAlign: 'center' as const,
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
          <Section style={headerStyle}>
            <Img
              src={`${BASE_URL}/icon-192.png`}
              alt="MVR"
              style={logoImgStyle}
            />
            <Text style={logoTextStyle}>MVR</Text>
          </Section>

          <div style={cardStyle}>
            {children}
          </div>

          <Hr style={footerHrStyle} />

          <div style={footerStyle}>
            <Img
              src={`${BASE_URL}/cofounder-matthew.jpg`}
              alt="Matthew"
              style={pfpStyle}
            />
            <Text style={footerNameStyle}>Matthew</Text>
            <Text style={footerRoleStyle}>Co-Founder, MVR</Text>

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

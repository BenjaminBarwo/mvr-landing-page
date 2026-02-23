export const metadata = {
  title: "Founding Seat Terms & Conditions | MVR",
};

export default function TermsPage() {
  return (
    <main
      style={{
        maxWidth: 680,
        margin: "0 auto",
        padding: "80px 24px 120px",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
        color: "#222",
      }}
    >
      <a
        href="/"
        style={{
          fontSize: 28,
          fontWeight: 300,
          letterSpacing: "-1px",
          color: "#222",
          textDecoration: "none",
        }}
      >
        MVR.
      </a>

      <h1
        style={{
          fontSize: 36,
          fontWeight: 300,
          letterSpacing: "-1.5px",
          marginTop: 48,
          marginBottom: 8,
          lineHeight: 1.4,
        }}
      >
        Founding Seat Terms &amp; Conditions
      </h1>
      <p style={{ fontSize: 14, fontWeight: 300, color: "#666", marginBottom: 48 }}>
        Last updated: February 22, 2026
      </p>

      <div style={{ fontSize: 15, fontWeight: 300, lineHeight: 2, letterSpacing: "-0.2px" }}>
        <Section title="1. Overview">
          <p>
            These Founding Seat Terms &amp; Conditions (&quot;Terms&quot;) govern your
            reservation of a founding seat on the MVR platform (&quot;Platform&quot;),
            operated by MVR Technologies LLC (&quot;MVR,&quot; &quot;we,&quot; &quot;us,&quot;
            or &quot;our&quot;). By completing the founding seat reservation process and
            submitting payment, you (&quot;Applicant,&quot; &quot;you,&quot; or &quot;your&quot;)
            agree to be bound by these Terms.
          </p>
        </Section>

        <Section title="2. Founding Seat Reservation">
          <p>
            A founding seat reservation secures your priority access to the MVR platform
            within your selected ZIP code and professional role category. Founding seat
            reservations are subject to availability and are allocated on a first-come,
            first-served basis. MVR reserves the right to limit the number of founding
            seats available per ZIP code and per professional role.
          </p>
        </Section>

        <Section title="3. Activation Credit &amp; Payment">
          <p>
            The founding seat reservation requires a one-time payment of $100.00 USD
            (the &quot;Activation Credit&quot;). The Activation Credit is non-refundable
            under all circumstances, including but not limited to: cancellation by the
            Applicant, failure to complete onboarding, changes in business circumstances,
            or dissatisfaction with the Platform.
          </p>
          <p style={{ marginTop: 16 }}>
            The Activation Credit will be applied to your first month of active service
            on the MVR platform once the Platform launches in your designated ZIP code.
            If the Platform does not launch in your ZIP code within 12 months of your
            reservation date, MVR will, at its sole discretion, either (a) apply the
            credit to an adjacent service area, or (b) issue a refund of the Activation
            Credit.
          </p>
        </Section>

        <Section title="4. Eligibility">
          <p>
            Founding seat reservations are available to licensed and actively practicing
            real estate professionals in the Houston metropolitan area, including but not
            limited to: real estate agents, mortgage lenders, home inspectors, title
            company representatives, appraisers, and contractors. MVR reserves the right
            to verify your professional status and reject or revoke any reservation that
            does not meet eligibility requirements.
          </p>
        </Section>

        <Section title="5. No Guarantee of Service">
          <p>
            A founding seat reservation does not constitute a guarantee of service,
            lead volume, revenue, or any specific outcome. The MVR platform is in
            pre-launch development, and features, pricing, coverage areas, and
            availability are subject to change without notice. MVR makes no
            representations or warranties, express or implied, regarding the
            Platform&apos;s performance, availability, or suitability for your
            business needs.
          </p>
        </Section>

        <Section title="6. Seat Assignment &amp; Exclusivity">
          <p>
            Founding seats are assigned to a specific ZIP code and professional role
            combination. Seat assignments are non-transferable and may not be resold,
            sublicensed, or assigned to any third party without prior written consent
            from MVR. MVR reserves the right to adjust seat caps, ZIP code boundaries,
            and role categories as needed to maintain platform quality.
          </p>
        </Section>

        <Section title="7. Application Review">
          <p>
            All founding seat reservations are subject to review and approval by MVR.
            Payment of the Activation Credit does not guarantee acceptance. If your
            application is rejected after payment, MVR will refund the Activation
            Credit in full within 30 business days.
          </p>
        </Section>

        <Section title="8. Data Collection &amp; Privacy">
          <p>
            Information collected during the reservation process (including name, email,
            phone number, ZIP code, professional role, and business metrics) will be
            used solely for the purposes of processing your reservation, communicating
            with you about the Platform, and improving our services. We will not sell
            your personal information to third parties. Payment processing is handled
            securely by Stripe, Inc., and MVR does not store your full payment card
            details.
          </p>
        </Section>

        <Section title="9. Limitation of Liability">
          <p>
            To the maximum extent permitted by applicable law, MVR, its officers,
            directors, employees, agents, and affiliates shall not be liable for any
            indirect, incidental, special, consequential, or punitive damages, or any
            loss of profits, revenue, data, or business opportunities, arising out of
            or related to your founding seat reservation or use of the Platform,
            regardless of the theory of liability.
          </p>
          <p style={{ marginTop: 16 }}>
            MVR&apos;s total aggregate liability arising out of or related to these
            Terms shall not exceed the amount of the Activation Credit paid by you
            ($100.00 USD).
          </p>
        </Section>

        <Section title="10. Indemnification">
          <p>
            You agree to indemnify, defend, and hold harmless MVR and its officers,
            directors, employees, and agents from and against any claims, liabilities,
            damages, losses, costs, or expenses (including reasonable attorneys&apos;
            fees) arising out of or related to your breach of these Terms, your use of
            the Platform, or any misrepresentation regarding your professional status
            or eligibility.
          </p>
        </Section>

        <Section title="11. Dispute Resolution">
          <p>
            Any disputes arising out of or related to these Terms shall be resolved
            through binding arbitration administered by the American Arbitration
            Association in Houston, Texas, in accordance with its Commercial
            Arbitration Rules. The arbitrator&apos;s decision shall be final and
            binding. You waive any right to participate in a class action lawsuit or
            class-wide arbitration.
          </p>
        </Section>

        <Section title="12. Governing Law">
          <p>
            These Terms shall be governed by and construed in accordance with the laws
            of the State of Texas, without regard to its conflict of law provisions.
          </p>
        </Section>

        <Section title="13. Modifications">
          <p>
            MVR reserves the right to modify these Terms at any time. Material changes
            will be communicated to Applicants via the email address provided during
            registration. Continued participation in the founding seat program after
            notification of changes constitutes acceptance of the modified Terms.
          </p>
        </Section>

        <Section title="14. Contact">
          <p>
            For questions regarding these Terms or your founding seat reservation,
            contact us at{" "}
            <a
              href="mailto:support@mvrplatform.com"
              style={{ color: "#222", textUnderlineOffset: 3 }}
            >
              support@mvrplatform.com
            </a>
            .
          </p>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 400,
          letterSpacing: "-0.5px",
          marginBottom: 8,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

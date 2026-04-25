import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Preview,
  Font,
} from "@react-email/components";

interface NewsletterEmailProps {
  subject: string;
  previewText: string;
  bodyHtml: string;
  unsubscribeUrl: string;
}

export function NewsletterEmail({
  subject,
  previewText,
  bodyHtml,
  unsubscribeUrl,
}: NewsletterEmailProps) {
  return (
    <Html lang="en">
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>The Fearless</Text>
          </Section>

          <Section style={content}>
            <Text style={heading}>{subject}</Text>
            <div
              style={bodyContent}
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              You received this because you subscribed to The Fearless newsletter.{" "}
              <a href={unsubscribeUrl} style={unsubscribeLink}>
                Unsubscribe
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#0a0a0a",
  fontFamily: "Inter, Helvetica, Arial, sans-serif",
  margin: "0",
  padding: "0",
};

const container = {
  maxWidth: "560px",
  margin: "0 auto",
  padding: "40px 24px",
};

const header = {
  marginBottom: "32px",
};

const logo = {
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: "800",
  letterSpacing: "-0.03em",
  margin: "0",
};

const content = {
  marginBottom: "32px",
};

const heading = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "800",
  letterSpacing: "-0.03em",
  lineHeight: "1.2",
  margin: "0 0 20px 0",
};

const bodyContent = {
  color: "#a1a1aa",
  fontSize: "15px",
  lineHeight: "1.7",
};

const divider = {
  borderColor: "#1f1f1f",
  margin: "0 0 24px 0",
};

const footer = {};

const footerText = {
  color: "#52525b",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0",
};

const unsubscribeLink = {
  color: "#71717a",
  textDecoration: "underline",
};

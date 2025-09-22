# Security Policy

## Supported Versions

We actively support the following versions of Open Macaron with security updates:

| Version | Supported          |
| ------- | ------------------ |
| main    | ✅ (latest)        |
| develop | ⚠️ (beta)          |
| < 1.0   | ❌                 |

## Reporting a Vulnerability

We take the security of Open Personal Agent seriously. If you believe you have found a security vulnerability in Open Personal Agent, we encourage you to let us know right away. We will investigate all legitimate reports and do our best to quickly fix the problem.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report security vulnerabilities by emailing [security@yourproject.com]. You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

### What to Include

Please include the following information in your report:

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

This information will help us triage your report more quickly.

### Preferred Languages

We prefer all communications to be in English.

### Response Process

1. **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours.
2. **Investigation**: We will investigate and validate the reported vulnerability.
3. **Resolution**: We will work on a fix and coordinate the release timeline with you.
4. **Disclosure**: We will publicly disclose the vulnerability after a fix has been released.

### Responsible Disclosure Timeline

- **Day 0**: Vulnerability reported
- **Day 1-2**: Acknowledgment of report
- **Day 3-14**: Investigation and validation
- **Day 15-45**: Development and testing of fix
- **Day 46-60**: Coordinated disclosure and release

We may ask for your assistance during the investigation and resolution process.

## Security Best Practices

When using Open Personal Agent, please follow these security best practices:

### API Key Security
- **Never commit API keys** to version control
- Use environment variables to store sensitive configuration
- Rotate API keys regularly
- Use minimal permissions for API keys

### Network Security
- Use HTTPS in production environments
- Implement proper CORS policies
- Validate all input data
- Use secure headers (CSP, HSTS, etc.)

### Deployment Security
- Keep dependencies up to date
- Use security scanning tools
- Implement proper logging and monitoring
- Use secure deployment practices

### Data Protection
- Encrypt sensitive data at rest and in transit
- Implement proper access controls
- Regular security audits
- Follow data protection regulations (GDPR, etc.)

## Security Updates

Security updates will be released as soon as possible after a vulnerability is confirmed and a fix is available. We will:

1. Release a patched version
2. Update this security policy if necessary
3. Notify users through our communication channels
4. Provide upgrade instructions

## Acknowledgments

We would like to thank the following individuals for their responsible disclosure of security vulnerabilities:

- (Names will be added as vulnerabilities are reported and resolved)

## Questions

If you have questions about this security policy, please email [security@yourproject.com].

---

Thank you for helping keep Open Personal Agent and our users safe!

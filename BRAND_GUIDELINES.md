# Aetheron Brand Guidelines

**Official Brand & Design Standards**  
Version 1.0 | February 2026

---

## Table of Contents
1. [Brand Overview](#brand-overview)
2. [Logo Usage](#logo-usage)
3. [Color Palette](#color-palette)
4. [Typography](#typography)
5. [UI Components](#ui-components)
6. [Spacing & Layout](#spacing--layout)
7. [Imagery & Graphics](#imagery--graphics)
8. [Voice & Tone](#voice--tone)
9. [Do's and Don'ts](#dos-and-donts)

---

## 1. Brand Overview

### Mission
To democratize access to advanced DeFi tools and passive income opportunities through accessible, transparent, and community-driven financial infrastructure.

### Vision
A future where everyone can participate in decentralized finance with confidence, clarity, and control over their financial destiny.

### Brand Values
- **Accessibility:** DeFi for everyone, regardless of technical expertise
- **Transparency:** Open-source code, clear documentation, honest communication
- **Community:** Governed by users, built for users
- **Innovation:** Cutting-edge features without sacrificing usability
- **Security:** Trustless, auditable smart contracts

### Brand Personality
- **Professional yet approachable:** Serious about security, friendly in communication
- **Technical but not intimidating:** Explain complexity simply
- **Forward-thinking:** Embrace innovation while respecting fundamentals
- **Community-focused:** "We" not "I", collaborative spirit

---

## 2. Logo Usage

### Primary Logo
The Aetheron logo consists of:
- **Symbol:** [Circular design with gradient]
- **Wordmark:** "AETHERON" in custom typography
- **Ticker:** "(AETH)" when appropriate

### Clear Space
Maintain a minimum clear space around the logo equal to the height of the "A" in "AETHERON" on all sides. This ensures the logo isn't crowded by other elements.

```
Minimum clear space = Height of "A"
┌───────────────────────────────┐
│           [SPACE]             │
│   ┌───────────────────┐       │
│   │   AETHERON LOGO   │       │
│   └───────────────────┘       │
│           [SPACE]             │
└───────────────────────────────┘
```

### Minimum Size
- **Digital:** 48px height minimum
- **Print:** 0.5 inch height minimum
- **Favicon:** 32x32px (simplified icon only)

### Approved Variations

**1. Full Logo (Primary)**
- Use: Website headers, marketing materials, presentations
- Background: Dark backgrounds (#0A0A0A, #1A1A2E)
- Color: Full color with gradient

**2. Icon Only**
- Use: App icons, social media avatars, favicons
- Maintains circular format
- Recognizable without wordmark

**3. Monochrome White**
- Use: When full color isn't possible
- Background: Dark only
- One color: #FFFFFF

**4. Monochrome Black**
- Use: Light backgrounds (if absolutely necessary)
- Background: White or very light colors
- One color: #000000

### Logo Don'ts

❌ **NEVER:**
1. Change the logo colors (except approved monochrome versions)
2. Stretch or distort the proportions
3. Rotate the logo at odd angles
4. Add drop shadows, glows, or effects
5. Place on busy or low-contrast backgrounds
6. Rearrange elements (separate symbol from wordmark)
7. Use outdated versions
8. Recreate or redraw the logo
9. Animate the logo without approval
10. Use the logo as part of a sentence or paragraph

### Logo Files
- **Vector:** `logo.svg` (scalable, preferred for print)
- **PNG:** `logo.png` (transparent background, web use)
- **Icon:** `icon.png` (512x512px, app use)
- **Favicon:** `favicon.ico` (32x32px, browser tab)

---

## 3. Color Palette

### Primary Colors

**Aetheron Cyan (Primary Brand Color)**
```
Hex:     #00D4FF
RGB:     0, 212, 255
CMYK:    100, 17, 0, 0
Pantone: Process Cyan C (approximate)

Usage: Primary buttons, links, active states, highlights, hero sections
Accessibility: AA contrast on dark backgrounds (#0A0A0A, #1A1A2E)
```

**Aetheron Violet (Secondary Brand Color)**
```
Hex:     #8A2BE2
RGB:     138, 43, 226
CMYK:    70, 81, 0, 0
Pantone: 2665 C (approximate)

Usage: Secondary buttons, gradients, accent elements, hover states
Accessibility: AA contrast on dark backgrounds
```

### Gradient

**Primary Gradient (Signature Look)**
```css
background: linear-gradient(135deg, #00D4FF 0%, #8A2BE2 100%);
```
- **Direction:** 135 degrees (diagonal top-left to bottom-right)
- **Usage:** Headlines, hero sections, buttons, feature cards, dividers
- **Alternative angles:** 90deg (vertical), 180deg (horizontal) - maintain color order

### Accent Colors

**Success Green**
```
Hex:     #00FF88
RGB:     0, 255, 136
Usage: Success messages, positive metrics, "connected" states
```

**Warning Orange**
```
Hex:     #FF6B35
RGB:     255, 107, 53
Usage: Warnings, important notices, alert states, risk disclosures
```

**Error Red**
```
Hex:     #FF3366
RGB:     255, 51, 102
Usage: Error messages, failed transactions, critical alerts
```

### Background Colors

**Dark Primary (Main Background)**
```
Hex:     #0A0A0A
RGB:     10, 10, 10
Usage: Page backgrounds, main sections
```

**Dark Secondary (Cards & Containers)**
```
Hex:     #1A1A2E
RGB:     26, 26, 46
Usage: Cards, modals, elevated surfaces, navigation
```

**Dark Tertiary (Hover/Active)**
```
Hex:     #2A2A3E
RGB:     42, 42, 62
Usage: Hover states, active selections, input focus
```

### Text Colors

**Primary Text (High Emphasis)**
```
Hex:     #FFFFFF
RGB:     255, 255, 255
Opacity: 100%
Usage: Headings, primary content, important labels
```

**Secondary Text (Medium Emphasis)**
```
Hex:     #999999
RGB:     153, 153, 153
Opacity: 100% (or #FFFFFF at 60% opacity)
Usage: Body text, descriptions, secondary labels
```

**Tertiary Text (Low Emphasis)**
```
Hex:     #666666
RGB:     102, 102, 102
Opacity: 100% (or #FFFFFF at 40% opacity)
Usage: Placeholder text, disabled states, timestamps
```

### Color Usage Guidelines

**Do:**
- Use Aetheron Cyan for primary actions (Connect Wallet, Stake Now)
- Use Aetheron Violet for secondary actions (Learn More, View Details)
- Use gradients sparingly for maximum impact
- Maintain contrast ratios of at least 4.5:1 for text
- Use accent colors consistently (green = success, orange = warning, red = error)

**Don't:**
- Use brand colors for every element (causes visual fatigue)
- Mix gradients with multiple angles on same page
- Use low-contrast color combinations
- Change brand color values "slightly" (use exact values)
- Use accent colors for branding (they're functional, not brand)

---

## 4. Typography

### Primary Font Family: Inter

**Why Inter?**
- Excellent readability at all sizes
- Wide language support
- Professional and modern
- Optimized for digital screens
- Free and open-source

**Weights Available:**
- Light (300) - Rarely used, large headings only
- Regular (400) - Body text, default
- Medium (500) - Emphasized text, card titles
- Semi-Bold (600) - Subheadings, important labels
- Bold (700) - Main headings, CTAs

**Font Loading:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### Typography Scale

**H1 - Page Titles**
```css
font-family: 'Inter', sans-serif;
font-size: 3rem;        /* 48px */
font-weight: 700;       /* Bold */
line-height: 1.2;
letter-spacing: -0.02em;
color: #FFFFFF;
```
Usage: Main page headings, hero titles

**H2 - Section Headings**
```css
font-size: 2.5rem;      /* 40px */
font-weight: 700;
line-height: 1.3;
letter-spacing: -0.015em;
```
Usage: Major section titles

**H3 - Subsection Headings**
```css
font-size: 2rem;        /* 32px */
font-weight: 600;       /* Semi-Bold */
line-height: 1.4;
letter-spacing: -0.01em;
```
Usage: Card titles, subsections

**H4 - Card Titles**
```css
font-size: 1.5rem;      /* 24px */
font-weight: 600;
line-height: 1.5;
```
Usage: Feature cards, modal titles

**H5 - Labels**
```css
font-size: 1.25rem;     /* 20px */
font-weight: 500;       /* Medium */
line-height: 1.6;
```
Usage: Form labels, small headings

**H6 - Small Headings**
```css
font-size: 1rem;        /* 16px */
font-weight: 600;
line-height: 1.6;
text-transform: uppercase;
letter-spacing: 0.05em;
```
Usage: Categories, tags, metadata

**Body Large**
```css
font-size: 1.125rem;    /* 18px */
font-weight: 400;       /* Regular */
line-height: 1.7;
color: #FFFFFF;
```
Usage: Introductions, important descriptions

**Body Regular**
```css
font-size: 1rem;        /* 16px */
font-weight: 400;
line-height: 1.6;
color: #999999;
```
Usage: Default body text, descriptions

**Body Small**
```css
font-size: 0.875rem;    /* 14px */
font-weight: 400;
line-height: 1.5;
color: #999999;
```
Usage: Captions, metadata, timestamps

**Caption / Fine Print**
```css
font-size: 0.75rem;     /* 12px */
font-weight: 400;
line-height: 1.4;
color: #666666;
```
Usage: Disclaimers, legal text, tiny labels

### Monospace Font: Courier New / Monaco

**Usage:** Smart contract addresses, transaction hashes, code snippets

```css
font-family: 'Courier New', Monaco, monospace;
font-size: 0.875rem;    /* 14px */
font-weight: 400;
background: rgba(255, 255, 255, 0.05);
padding: 0.25rem 0.5rem;
border-radius: 4px;
color: #00D4FF;
```

**Example:**
```html
<code>0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e</code>
```

### Typography Guidelines

**Do:**
- Use consistent hierarchy (H1 → H2 → H3, don't skip levels)
- Maintain line-height between 1.4-1.7 for readability
- Use medium/semi-bold weights for emphasis, not bold everywhere
- Let body text breathe (adequate line-height and paragraph spacing)
- Use sentence case for body text, Title Case for headings

**Don't:**
- Mix multiple font families (Inter only, except code)
- Use too many font sizes (stick to the scale)
- Set body text smaller than 16px (14px minimum for captions)
- Use all caps for long text (short labels only)
- Use light weights (300) on dark backgrounds (poor readability)

---

## 5. UI Components

### Buttons

**Primary Button (Main CTAs)**
```css
background: linear-gradient(135deg, #00D4FF, #8A2BE2);
color: #FFFFFF;
font-size: 1rem;
font-weight: 600;
padding: 1rem 2rem;
border-radius: 12px;
border: none;
cursor: pointer;
transition: transform 0.2s, box-shadow 0.3s;
```
Hover: `transform: translateY(-2px); box-shadow: 0 10px 30px rgba(0, 212, 255, 0.4);`

**Secondary Button**
```css
background: transparent;
color: #00D4FF;
border: 2px solid #00D4FF;
/* Same padding, radius, font as primary */
```
Hover: `background: rgba(0, 212, 255, 0.1);`

**Tertiary Button (Text Only)**
```css
background: transparent;
color: #999999;
border: none;
padding: 0.5rem 1rem;
```
Hover: `color: #FFFFFF;`

### Cards

**Standard Card**
```css
background: rgba(26, 26, 46, 0.8);
border-radius: 20px;
padding: 2rem;
backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.05);
transition: transform 0.3s, box-shadow 0.3s;
```
Hover: `transform: translateY(-5px); box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);`

**Feature Card (Highlighted)**
```css
background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(138, 43, 226, 0.1));
border: 1px solid rgba(0, 212, 255, 0.2);
/* Same dimensions as standard card */
```

### Inputs

**Text Input / Number Input**
```css
background: rgba(255, 255, 255, 0.05);
border: 2px solid rgba(255, 255, 255, 0.1);
border-radius: 10px;
color: #FFFFFF;
font-size: 1rem;
padding: 1rem 1.5rem;
width: 100%;
transition: border-color 0.3s, box-shadow 0.3s;
```
Focus: `border-color: #00D4FF; box-shadow: 0 0 0 4px rgba(0, 212, 255, 0.1);`

**Dropdown / Select**
```css
/* Same as text input */
background-image: url('data:image/svg+xml,...'); /* Custom arrow icon */
```

### Icons

- **Library:** Font Awesome 6 (Free)
- **Style:** Regular (far) or Solid (fas)
- **Size:** 1rem default, 1.5rem for emphasis, 2rem for features
- **Color:** Match surrounding text color

**Common Icons:**
- Connect: `fa-wallet`
- Staking: `fa-coins`, `fa-lock`
- Trading: `fa-chart-line`, `fa-exchange-alt`
- Portfolio: `fa-briefcase`, `fa-chart-pie`
- Settings: `fa-cog`
- User: `fa-user-circle`
- Notifications: `fa-bell`
- Info: `fa-info-circle`
- Warning: `fa-exclamation-triangle`
- Success: `fa-check-circle`
- Error: `fa-times-circle`

---

## 6. Spacing & Layout

### Spacing Scale

Use a consistent 8px base unit:

```
4px   (0.25rem)  - Tiny gaps (icon-text spacing)
8px   (0.5rem)   - Small padding (buttons, badges)
12px  (0.75rem)  - Compact spacing (list items)
16px  (1rem)     - Default spacing (paragraphs)
24px  (1.5rem)   - Medium spacing (card padding)
32px  (2rem)     - Large spacing (sections)
48px  (3rem)     - Extra large (hero sections)
64px  (4rem)     - Maximum (major sections)
96px  (6rem)     - Hero spacing
```

### Container Widths

```
Mobile:         100% (with 1rem side padding)
Tablet:         768px max-width
Desktop Small:  900px max-width (forms, text content)
Desktop Large:  1200px max-width (dashboard, visuals)
Full Width:     1400px max-width (hero sections)
```

### Grid System

Use CSS Grid for layouts:

**3-Column Layout (Feature Cards)**
```css
display: grid;
grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
gap: 2rem;
```

**2-Column Layout (Forms)**
```css
display: grid;
grid-template-columns: 1fr 1fr;
gap: 1.5rem;
```

**Responsive:**
- Mobile: 1 column
- Tablet (768px+): 2 columns
- Desktop (1024px+): 3 columns

### Border Radius

```
Small:   8px   - Buttons, badges, small cards
Medium:  12px  - Standard buttons, inputs
Large:   20px  - Cards, modals, major containers
Circle:  50%   - Avatar, icon buttons
```

---

## 7. Imagery & Graphics

### Photography Style

**Preferred:**
- Dark, moody backgrounds with neon/cyan highlights
- Technology and blockchain themed
- Abstract geometric patterns
- Futuristic interfaces and dashboards
- Community and collaboration imagery

**Avoid:**
- Stock photos of "business people"
- Generic cryptocurrency imagery (Bitcoin logos, gold coins)
- Bright, saturated, unrelated imagery
- Low-resolution or pixelated images

### Illustrations

- **Style:** Geometric, minimal, modern
- **Colors:** Use brand colors (cyan, violet, dark backgrounds)
- **Usage:** Explain complex concepts, onboarding tutorials, error states

### Icons

- **Style:** Outlined or solid, consistent throughout
- **Source:** Font Awesome 6 Free
- **Do NOT mix:** Different icon packs on same page

### Image Optimization

- **Format:** WebP preferred (with PNG fallback)
- **Compression:** 80% quality minimum
- **Dimensions:** Serve appropriate sizes for device (responsive images)
- **Alt text:** Always include descriptive alt text

---

## 8. Voice & Tone

### Brand Voice

**Characteristics:**
1. **Clear & Concise:** Avoid jargon, explain complexity simply
2. **Confident but not arrogant:** We know DeFi, but we're here to help
3. **Friendly & Approachable:** Welcome newcomers, support learning
4. **Transparent & Honest:** Acknowledge risks, never promise guaranteed returns
5. **Community-focused:** "We" and "our" over "I" and "my"

### Writing Style

**Headings:**
- Active voice preferred
- Benefit-driven (focus on user value)
- Short and punchy (under 8 words)

**Examples:**
```
✅ "Stake AETH and Earn Up to 25% APY"
✅ "Join the Social Trading Revolution"
✅ "Transparent Tokenomics, No Hidden Fees"

❌ "High APY Staking Opportunities Are Available"
❌ "You Can Trade Socially With Other Users"
❌ "Our Tokenomics Are Designed With Transparency"
```

**Body Text:**
- Short paragraphs (2-4 sentences)
- Break up long content with subheadings
- Use bullet points for lists
- Highlight key terms (bold, not all caps)

**CTAs (Call to Actions):**
- Action-oriented verbs
- Create urgency or value
- Keep under 4 words when possible

**Examples:**
```
✅ "Connect Wallet"
✅ "Start Staking"
✅ "Claim Rewards"
✅ "View Dashboard"
✅ "Learn More"

❌ "Click Here"
❌ "Submit"
❌ "Go"
```

### Tone Variations

**Dashboard/App (Functional):**
- Direct and concise
- Focus on actions and data
- Neutral, informative
- Example: "Stake 1,000 AETH for 180 days to earn 25% APY"

**Marketing (Inspirational):**
- Enthusiastic and aspirational
- Benefit-focused
- Emotional connection
- Example: "Unlock passive income with industry-leading staking rewards. Your financial freedom starts here."

**Documentation (Educational):**
- Patient and thorough
- Step-by-step clarity
- Assume no prior knowledge
- Example: "To add Polygon network to MetaMask, follow these steps..."

**Error Messages (Supportive):**
- Empathetic, not blaming
- Explain what happened and why
- Provide clear next steps
- Example: "Transaction failed: Insufficient MATIC for gas. Add more MATIC to your wallet and try again."

### Risk Warnings

Always include risk disclaimers on financial content:

**Standard Disclaimer:**
```
⚠️ Cryptocurrency investments carry risk. Never invest more than you can afford to lose. 
Aetheron does not provide financial advice. DYOR (Do Your Own Research).
```

**Where to Include:**
- Staking pages
- Trading features
- Marketing materials mentioning APY
- Social media posts about earnings

---

## 9. Do's and Don'ts

### Logo & Branding

✅ **DO:**
- Use official logo files from GitHub repository
- Maintain clear space around logo
- Use approved color variations only
- Scale proportionally
- Place on high-contrast backgrounds

❌ **DON'T:**
- Recreate or modify the logo
- Change brand colors
- Add effects (shadows, glows, outlines)
- Rotate or distort logo
- Use low-resolution versions

### Color Usage

✅ **DO:**
- Use hex codes exactly as specified
- Maintain contrast ratios (4.5:1 minimum for text)
- Use gradients sparingly for impact
- Test colors on different screens

❌ **DON'T:**
- "Eyeball" colors or use approximations
- Use rainbow gradients or unrelated colors
- Sacrifice readability for aesthetics
- Mix too many colors on one screen

### Typography

✅ **DO:**
- Use Inter font family consistently
- Follow the type scale
- Maintain adequate line-height (1.4-1.7)
- Use hierarchy (H1 → H2 → H3)

❌ **DON'T:**
- Mix multiple font families
- Use fonts smaller than 12px
- Create custom type sizes outside the scale
- Use all caps for paragraphs

### Writing

✅ **DO:**
- Be clear and concise
- Explain technical terms
- Include risk warnings
- Use active voice

❌ **DON'T:**
- Make unrealistic promises ("guaranteed returns")
- Use complex jargon without explanation
- Ignore risks or downplay dangers
- Use passive voice excessively

### UI/UX

✅ **DO:**
- Follow spacing scale (8px base unit)
- Use consistent border radius
- Provide visual feedback (hover, active states)
- Design mobile-first

❌ **DON'T:**
- Create arbitrary spacing values
- Mix rounded and sharp corners inconsistently
- Use disabled buttons without explanation
- Forget mobile optimization

---

## File Resources

All brand assets are available in the GitHub repository:

**Repository:** https://github.com/mastatrill/Aetheron_platform

**Key Files:**
- `/assets/logo.svg` - Primary logo (vector)
- `/assets/logo.png` - Primary logo (PNG, transparent)
- `/assets/icon.png` - App icon (512x512px)
- `/assets/favicon.ico` - Browser favicon
- `MEDIA_KIT.md` - Complete press and media resources
- `README.md` - Project overview

**For Questions:**
Contact: [@William_McCoy_](https://twitter.com/William_McCoy_) on Twitter

---

## Version History

**v1.0** (February 2026)
- Initial brand guidelines release
- Logo usage rules
- Color palette established
- Typography scale defined
- UI component standards
- Voice and tone guidelines

---

**Last Updated:** February 8, 2026  
**Maintained by:** Aetheron Team  
**For updates, visit:** https://github.com/mastatrill/Aetheron_platform

---

Thank you for maintaining brand consistency! 🚀

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface ScreenAnalysis {
  page_name: string;
  section: string;
  url_pattern: string;
  layout: {
    navigation: string[];
    header: string;
    main_content: string;
  };
  components: Array<{
    type: string;
    label: string;
    purpose: string;
    fields?: string[];
  }>;
  workflow: {
    entry_points: string[];
    exit_points: string[];
    actions_available: string[];
  };
}

const SYSTEM_PROMPT = `You are a UI analyst. Your job is to examine screenshots of a web application and extract a structured description of every UI component, layout zone, and workflow element visible on screen.

Always respond with valid JSON matching this exact shape:
{
  "page_name": "string — human-readable name of this screen (e.g. 'Loan Detail', 'Draw Request Form')",
  "section": "string — the product area (e.g. 'Construction Management', 'Borrower Portal', 'Admin')",
  "url_pattern": "string — generalised URL pattern, replace IDs with :id (e.g. '/loans/:id/draws')",
  "layout": {
    "navigation": ["array of navigation items visible in sidebar/header"],
    "header": "description of the page header / breadcrumb",
    "main_content": "description of the main content area"
  },
  "components": [
    {
      "type": "one of: table | form | modal | button | card | tabs | sidebar | header | breadcrumb | chart | map | timeline | status-badge | dropdown | search | filter | pagination | upload | notification | other",
      "label": "the visible label or title of this component",
      "purpose": "what action or information this component serves",
      "fields": ["if type=form, list each field label; otherwise omit"]
    }
  ],
  "workflow": {
    "entry_points": ["how the user likely arrived at this screen"],
    "exit_points": ["navigation or actions that take the user to another screen"],
    "actions_available": ["list every button, link, or interactive element and what it does"]
  }
}

Be thorough — list every visible component. Infer purpose from context when labels aren't visible.`;

export async function analyzeScreenshot(
  screenshotDataUrl: string,
  url: string,
  title: string
): Promise<ScreenAnalysis> {
  // Strip the data URL prefix to get the base64 content
  const base64 = screenshotDataUrl.replace(/^data:image\/\w+;base64,/, '');

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/png', data: base64 },
          },
          {
            type: 'text',
            text: `URL: ${url}\nPage title: ${title}\n\nAnalyse this screenshot and return the JSON.`,
          },
        ],
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  // Extract JSON from the response (Claude may wrap it in a code block)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, text];
  const json = (jsonMatch[1] ?? text).trim();

  return JSON.parse(json) as ScreenAnalysis;
}

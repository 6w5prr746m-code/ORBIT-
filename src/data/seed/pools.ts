import type { SkillCategory } from '@/types'

export interface CountryPool {
  country: string
  cities: string[]
  firstNames: string[]
  lastNames: string[]
}

export const COUNTRY_POOLS: CountryPool[] = [
  {
    country: 'France',
    cities: ['Paris', 'Lyon'],
    firstNames: ['Camille', 'Lucas', 'Manon', 'Hugo', 'Chloe', 'Louis', 'Ines', 'Nathan', 'Sarah', 'Julien'],
    lastNames: ['Martin', 'Bernard', 'Dubois', 'Robert', 'Petit', 'Moreau', 'Laurent', 'Simon', 'Michel', 'Girard'],
  },
  {
    country: 'United Kingdom',
    cities: ['London', 'Manchester'],
    firstNames: ['Oliver', 'Amelia', 'George', 'Isla', 'Jack', 'Freya', 'Charlie', 'Grace', 'Henry', 'Ava'],
    lastNames: ['Smith', 'Taylor', 'Brown', 'Wilson', 'Evans', 'Walker', 'Hughes', 'Edwards', 'Green', 'Hall'],
  },
  {
    country: 'Germany',
    cities: ['Berlin', 'Munich'],
    firstNames: ['Lukas', 'Mia', 'Felix', 'Emma', 'Jonas', 'Hannah', 'Paul', 'Lena', 'Finn', 'Marie'],
    lastNames: ['Muller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Hoffmann', 'Koch'],
  },
  {
    country: 'United States',
    cities: ['New York', 'Austin'],
    firstNames: ['Liam', 'Olivia', 'Noah', 'Emma', 'James', 'Sophia', 'Benjamin', 'Isabella', 'Ethan', 'Mia'],
    lastNames: ['Johnson', 'Williams', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Martinez', 'Anderson', 'Thomas', 'Clark'],
  },
  {
    country: 'Spain',
    cities: ['Madrid', 'Barcelona'],
    firstNames: ['Hugo', 'Lucia', 'Martin', 'Sofia', 'Pablo', 'Martina', 'Alejandro', 'Valeria', 'Daniel', 'Paula'],
    lastNames: ['Garcia', 'Fernandez', 'Gonzalez', 'Rodriguez', 'Lopez', 'Martinez', 'Sanchez', 'Perez', 'Gomez', 'Diaz'],
  },
  {
    country: 'Netherlands',
    cities: ['Amsterdam'],
    firstNames: ['Daan', 'Julia', 'Sem', 'Sophie', 'Lucas', 'Anna', 'Milan', 'Eva', 'Levi', 'Fenna'],
    lastNames: ['de Jong', 'Jansen', 'de Vries', 'van den Berg', 'Bakker', 'Visser', 'Smit', 'Meijer', 'de Boer', 'Mulder'],
  },
]

export interface TeamDef {
  key: string
  name: string
  description: string
  department: string
  relatedTeamKeys: string[]
  jobTitles: { junior: string; mid: string; senior: string; lead: string }
  coreSkillCategories: SkillCategory[]
}

export const TEAM_DEFS: TeamDef[] = [
  {
    key: 'sales',
    name: 'Sales',
    description: 'Drives new business and expands relationships with enterprise customers.',
    department: 'Sales',
    relatedTeamKeys: ['customer-success', 'marketing'],
    jobTitles: {
      junior: 'Sales Development Representative',
      mid: 'Account Executive',
      senior: 'Senior Account Executive',
      lead: 'Head of Sales',
    },
    coreSkillCategories: ['Business'],
  },
  {
    key: 'customer-success',
    name: 'Customer Success',
    description: 'Ensures customers realize value and stay for the long term.',
    department: 'Customer Success',
    relatedTeamKeys: ['sales', 'product'],
    jobTitles: {
      junior: 'Customer Success Associate',
      mid: 'Customer Success Manager',
      senior: 'Senior Customer Success Manager',
      lead: 'Head of Customer Success',
    },
    coreSkillCategories: ['Business', 'Operations'],
  },
  {
    key: 'product',
    name: 'Product',
    description: 'Defines what gets built and why, in partnership with Engineering.',
    department: 'Product',
    relatedTeamKeys: ['engineering', 'design', 'marketing'],
    jobTitles: {
      junior: 'Associate Product Manager',
      mid: 'Product Manager',
      senior: 'Senior Product Manager',
      lead: 'Head of Product',
    },
    coreSkillCategories: ['Business', 'Technology'],
  },
  {
    key: 'engineering',
    name: 'Engineering',
    description: 'Builds and operates the products customers rely on.',
    department: 'Engineering',
    relatedTeamKeys: ['product', 'it'],
    jobTitles: {
      junior: 'Software Engineer',
      mid: 'Senior Software Engineer',
      senior: 'Staff Software Engineer',
      lead: 'Head of Engineering',
    },
    coreSkillCategories: ['Technology'],
  },
  {
    key: 'it',
    name: 'IT',
    description: 'Keeps internal systems, tooling and infrastructure secure and reliable.',
    department: 'IT',
    relatedTeamKeys: ['engineering', 'security'],
    jobTitles: {
      junior: 'IT Support Specialist',
      mid: 'Systems Engineer',
      senior: 'Senior Systems Engineer',
      lead: 'Head of IT',
    },
    coreSkillCategories: ['Technology', 'Operations'],
  },
  {
    key: 'finance',
    name: 'Finance',
    description: 'Manages financial planning, reporting and company-wide budgeting.',
    department: 'Finance',
    relatedTeamKeys: ['hr', 'operations'],
    jobTitles: {
      junior: 'Financial Analyst',
      mid: 'Senior Financial Analyst',
      senior: 'Finance Manager',
      lead: 'Head of Finance',
    },
    coreSkillCategories: ['Business'],
  },
  {
    key: 'hr',
    name: 'People',
    description: 'Supports hiring, growth and wellbeing across the organization.',
    department: 'People',
    relatedTeamKeys: ['finance', 'leadership'],
    jobTitles: {
      junior: 'People Coordinator',
      mid: 'People Partner',
      senior: 'Senior People Partner',
      lead: 'Head of People',
    },
    coreSkillCategories: ['Leadership', 'Business'],
  },
  {
    key: 'marketing',
    name: 'Marketing',
    description: 'Builds awareness and demand for the company and its products.',
    department: 'Marketing',
    relatedTeamKeys: ['product', 'sales'],
    jobTitles: {
      junior: 'Marketing Associate',
      mid: 'Marketing Manager',
      senior: 'Senior Marketing Manager',
      lead: 'Head of Marketing',
    },
    coreSkillCategories: ['Business', 'Design'],
  },
  {
    key: 'operations',
    name: 'Operations',
    description: 'Optimizes how the company runs day to day, end to end.',
    department: 'Operations',
    relatedTeamKeys: ['finance', 'customer-success'],
    jobTitles: {
      junior: 'Operations Associate',
      mid: 'Operations Manager',
      senior: 'Senior Operations Manager',
      lead: 'Head of Operations',
    },
    coreSkillCategories: ['Operations', 'Business'],
  },
  {
    key: 'design',
    name: 'Design',
    description: 'Shapes the experience of every product surface customers touch.',
    department: 'Design',
    relatedTeamKeys: ['product', 'marketing'],
    jobTitles: {
      junior: 'Product Designer',
      mid: 'Senior Product Designer',
      senior: 'Staff Product Designer',
      lead: 'Head of Design',
    },
    coreSkillCategories: ['Design'],
  },
]

export interface SkillDef {
  name: string
  category: SkillCategory
  description: string
}

export const SKILL_CATALOG: SkillDef[] = [
  // Technology
  { name: 'Python', category: 'Technology', description: 'General-purpose programming for backend systems and data work.' },
  { name: 'JavaScript', category: 'Technology', description: 'Core language for web application development.' },
  { name: 'TypeScript', category: 'Technology', description: 'Typed superset of JavaScript used across modern web apps.' },
  { name: 'React', category: 'Technology', description: 'Component-based library for building user interfaces.' },
  { name: 'Node.js', category: 'Technology', description: 'JavaScript runtime for building backend services.' },
  { name: 'SQL', category: 'Technology', description: 'Querying and managing relational databases.' },
  { name: 'Data Analysis', category: 'Technology', description: 'Turning raw data into actionable insight.' },
  { name: 'Artificial Intelligence', category: 'Technology', description: 'Applying machine learning and AI techniques to real problems.' },
  { name: 'Machine Learning', category: 'Technology', description: 'Building and training predictive models.' },
  { name: 'Cloud Infrastructure (AWS)', category: 'Technology', description: 'Designing and operating systems on AWS.' },
  { name: 'Cloud Infrastructure (Azure)', category: 'Technology', description: 'Designing and operating systems on Microsoft Azure.' },
  { name: 'DevOps', category: 'Technology', description: 'Continuous delivery, automation and infrastructure reliability.' },
  { name: 'Cybersecurity', category: 'Technology', description: 'Protecting systems and data from threats.' },
  { name: 'API Design', category: 'Technology', description: 'Designing clean, scalable service interfaces.' },
  { name: 'Salesforce', category: 'Technology', description: 'Configuring and extending the Salesforce CRM platform.' },
  { name: 'HubSpot', category: 'Technology', description: 'Marketing and CRM automation on HubSpot.' },
  { name: 'Data Engineering', category: 'Technology', description: 'Building pipelines that move and transform data reliably.' },
  { name: 'Kubernetes', category: 'Technology', description: 'Container orchestration at scale.' },
  { name: 'Mobile Development', category: 'Technology', description: 'Building native and cross-platform mobile apps.' },
  { name: 'QA & Test Automation', category: 'Technology', description: 'Ensuring software quality through automated testing.' },
  { name: 'Business Intelligence', category: 'Technology', description: 'Turning company data into dashboards and reports.' },
  { name: 'ERP Systems', category: 'Technology', description: 'Configuring and running enterprise resource planning systems.' },
  { name: 'Payroll Systems', category: 'Technology', description: 'Operating and integrating payroll platforms.' },
  { name: 'Identity & Access Management', category: 'Technology', description: 'Managing secure access to systems and data.' },
  { name: 'Network Engineering', category: 'Technology', description: 'Designing and maintaining network infrastructure.' },
  { name: 'GraphQL', category: 'Technology', description: 'Designing flexible, typed APIs with GraphQL.' },
  { name: 'Docker', category: 'Technology', description: 'Packaging and running applications in containers.' },
  { name: 'Terraform', category: 'Technology', description: 'Managing infrastructure as code.' },
  { name: 'Product Analytics', category: 'Technology', description: 'Instrumenting and analyzing product usage data.' },
  { name: 'A/B Testing', category: 'Technology', description: 'Running controlled experiments to guide decisions.' },
  { name: 'Natural Language Processing', category: 'Technology', description: 'Building systems that understand human language.' },
  { name: 'Computer Vision', category: 'Technology', description: 'Building systems that interpret visual data.' },
  { name: 'Blockchain', category: 'Technology', description: 'Designing systems on distributed ledger technology.' },
  { name: 'CRM Administration', category: 'Technology', description: 'Configuring and maintaining CRM platforms.' },
  { name: 'Workflow Automation', category: 'Technology', description: 'Automating repetitive processes across tools.' },

  // Business
  { name: 'Project Management', category: 'Business', description: 'Planning and delivering cross-functional projects.' },
  { name: 'Strategic Planning', category: 'Business', description: 'Setting long-term direction and priorities.' },
  { name: 'Financial Modeling', category: 'Business', description: 'Building models to forecast and evaluate financial outcomes.' },
  { name: 'Budgeting & Forecasting', category: 'Business', description: 'Planning and tracking organizational spend.' },
  { name: 'Negotiation', category: 'Business', description: 'Reaching favorable agreements with partners and customers.' },
  { name: 'Account Management', category: 'Business', description: 'Growing and retaining key customer relationships.' },
  { name: 'Enterprise Sales', category: 'Business', description: 'Selling into large, complex customer organizations.' },
  { name: 'Customer Onboarding', category: 'Business', description: 'Guiding new customers to their first value milestone.' },
  { name: 'Market Research', category: 'Business', description: 'Understanding markets, competitors and customer needs.' },
  { name: 'Payroll Integration', category: 'Business', description: 'Connecting payroll processes across systems and vendors.' },
  { name: 'Vendor Management', category: 'Business', description: 'Managing supplier relationships and contracts.' },
  { name: 'Contract Negotiation', category: 'Business', description: 'Drafting and negotiating commercial agreements.' },
  { name: 'M&A', category: 'Business', description: 'Evaluating and integrating mergers and acquisitions.' },
  { name: 'Investor Relations', category: 'Business', description: 'Communicating company performance to investors.' },
  { name: 'Pricing Strategy', category: 'Business', description: 'Setting pricing that balances growth and margin.' },
  { name: 'Go-To-Market Strategy', category: 'Business', description: 'Planning how products reach and win customers.' },
  { name: 'Partnerships', category: 'Business', description: 'Building strategic alliances with external organizations.' },
  { name: 'Compliance & Risk', category: 'Business', description: 'Managing regulatory and operational risk.' },
  { name: 'International Expansion', category: 'Business', description: 'Taking the business into new countries and markets.' },
  { name: 'Recruiting', category: 'Business', description: 'Sourcing and hiring great talent.' },
  { name: 'Talent Development', category: 'Business', description: 'Growing employee skills and career paths.' },
  { name: 'Compensation & Benefits', category: 'Business', description: 'Designing fair and competitive reward programs.' },
  { name: 'Employee Relations', category: 'Business', description: 'Supporting a healthy, fair workplace.' },
  { name: 'Public Relations', category: 'Business', description: 'Managing the company’s public narrative and media relationships.' },
  { name: 'Event Management', category: 'Business', description: 'Planning and running company and customer events.' },
  { name: 'Customer Retention', category: 'Business', description: 'Keeping customers engaged and reducing churn.' },
  { name: 'Renewals Management', category: 'Business', description: 'Managing the customer renewal lifecycle.' },
  { name: 'Channel Sales', category: 'Business', description: 'Selling through partners and resellers.' },
  { name: 'Competitive Analysis', category: 'Business', description: 'Tracking and analyzing competitor moves.' },
  { name: 'Business Development', category: 'Business', description: 'Identifying and building new growth opportunities.' },
  { name: 'Cost Optimization', category: 'Business', description: 'Finding efficiencies without sacrificing quality.' },
  { name: 'Board Reporting', category: 'Business', description: 'Preparing reporting and materials for the board.' },
  { name: 'Trade Compliance', category: 'Business', description: 'Navigating international trade regulations.' },
  { name: 'Localization Strategy', category: 'Business', description: 'Adapting products and content for new markets.' },
  { name: 'Customer Advocacy', category: 'Business', description: 'Turning happy customers into champions.' },

  // Language
  { name: 'English', category: 'Language', description: 'Professional working proficiency in English.' },
  { name: 'French', category: 'Language', description: 'Professional working proficiency in French.' },
  { name: 'German', category: 'Language', description: 'Professional working proficiency in German.' },
  { name: 'Spanish', category: 'Language', description: 'Professional working proficiency in Spanish.' },
  { name: 'Dutch', category: 'Language', description: 'Professional working proficiency in Dutch.' },
  { name: 'Italian', category: 'Language', description: 'Professional working proficiency in Italian.' },
  { name: 'Mandarin', category: 'Language', description: 'Professional working proficiency in Mandarin Chinese.' },
  { name: 'Portuguese', category: 'Language', description: 'Professional working proficiency in Portuguese.' },

  // Design
  { name: 'UX Design', category: 'Design', description: 'Designing usable, intuitive product experiences.' },
  { name: 'UI Design', category: 'Design', description: 'Crafting visual interfaces with care and consistency.' },
  { name: 'Design Systems', category: 'Design', description: 'Building reusable, scalable design foundations.' },
  { name: 'Prototyping', category: 'Design', description: 'Turning ideas into testable interactive prototypes.' },
  { name: 'Branding', category: 'Design', description: 'Shaping how the company looks and feels.' },
  { name: 'User Research', category: 'Design', description: 'Learning directly from users to guide decisions.' },
  { name: 'Motion Design', category: 'Design', description: 'Adding purposeful movement to product and brand.' },
  { name: 'Illustration', category: 'Design', description: 'Creating custom visual assets and iconography.' },

  // Operations
  { name: 'Supply Chain Management', category: 'Operations', description: 'Coordinating the flow of goods and services.' },
  { name: 'Process Improvement', category: 'Operations', description: 'Making operations faster, cheaper and more reliable.' },
  { name: 'Logistics', category: 'Operations', description: 'Planning the movement and storage of goods.' },
  { name: 'Facilities Management', category: 'Operations', description: 'Running the physical spaces the company operates in.' },
  { name: 'Business Continuity', category: 'Operations', description: 'Preparing the organization to withstand disruption.' },
  { name: 'Data Privacy', category: 'Operations', description: 'Protecting personal data in line with regulation.' },
  { name: 'Procurement', category: 'Operations', description: 'Sourcing goods and services cost-effectively.' },
  { name: 'Quality Assurance', category: 'Operations', description: 'Maintaining consistent operational quality standards.' },

  // Leadership
  { name: 'Team Leadership', category: 'Leadership', description: 'Leading and growing high-performing teams.' },
  { name: 'Coaching & Mentoring', category: 'Leadership', description: 'Developing others through coaching relationships.' },
  { name: 'Public Speaking', category: 'Leadership', description: 'Communicating clearly and confidently to groups.' },
  { name: 'Cross-functional Collaboration', category: 'Leadership', description: 'Working effectively across team boundaries.' },
  { name: 'Change Management', category: 'Leadership', description: 'Guiding teams through organizational change.' },
  { name: 'Executive Communication', category: 'Leadership', description: 'Communicating clearly with senior stakeholders.' },
  { name: 'Conflict Resolution', category: 'Leadership', description: 'Navigating and resolving workplace disagreements.' },
  { name: 'Decision Making', category: 'Leadership', description: 'Making sound calls under uncertainty.' },
]

export const BIO_TEMPLATES = [
  'Joined {org} to help scale {team}, focusing on {skill1} and {skill2}.',
  'Has spent the last {years} years growing the {team} function, with deep expertise in {skill1}.',
  'Passionate about {skill1} and {skill2}, and how they connect {team} to the rest of the business.',
  'Came to {org} from a background in {skill1}, now leading initiatives across {team}.',
  'Known across {org} as a go-to person for {skill1}, with a strong track record in {team}.',
  'Combines hands-on {skill1} experience with a big-picture view of {team} strategy.',
]

export const CAN_HELP_TEMPLATES = [
  'Getting started with {skill}',
  'Best practices for {skill}',
  'Troubleshooting {skill} issues',
  'Scaling {skill} across teams',
  'Evaluating tools for {skill}',
]

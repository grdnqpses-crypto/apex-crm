/**
 * Business Category / Vertical Intelligence System
 * Maps company types to enabled modules, terminology, and feature sets.
 * This is the single source of truth for all vertical-specific behavior.
 */

export type BusinessCategoryKey =
  | "freight_logistics"
  | "manufacturing"
  | "distribution_wholesale"
  | "retail_ecommerce"
  | "professional_services"
  | "healthcare"
  | "construction_trades"
  | "real_estate"
  | "financial_services"
  | "technology"
  | "general"; // fallback for uncategorized

export type BusinessSubType = {
  key: string;
  label: string;
};

export type VerticalModule =
  | "contacts"
  | "companies"
  | "deals"
  | "tasks"
  | "campaigns"
  | "email_deliverability"
  | "automation"
  | "analytics"
  | "segmentation"
  | "ab_testing"
  | "api_webhooks"
  | "paradigm_engine"
  | "compliance"
  | "load_management"
  | "smtp_engine"
  | "shipping_receiving"
  | "accounts_payable"
  | "accounts_receivable"
  | "billing_invoicing";

export type TerminologyOverride = {
  deals?: string;       // e.g. "Loads", "Jobs", "Projects", "Listings", "Cases"
  deal?: string;        // singular
  pipeline?: string;    // e.g. "Load Board", "Job Pipeline"
  companies?: string;   // e.g. "Shippers", "Clients", "Accounts"
  company?: string;
  contacts?: string;    // e.g. "Drivers", "Patients", "Tenants"
  contact?: string;
};

export type BusinessCategory = {
  key: BusinessCategoryKey;
  label: string;
  icon: string;           // lucide icon name
  description: string;
  subTypes: BusinessSubType[];
  enabledModules: VerticalModule[];
  terminology: TerminologyOverride;
  highlightedFeatures: string[];  // shown in onboarding tour
  aiContext: string;              // injected into AI assistant system prompt
};

export const BUSINESS_CATEGORIES: BusinessCategory[] = [
  {
    key: "freight_logistics",
    label: "Freight & Logistics",
    icon: "Truck",
    description: "Freight brokers, carriers, 3PLs, dispatchers, and shippers",
    subTypes: [
      { key: "freight_broker", label: "Freight Broker" },
      { key: "carrier", label: "Carrier / Trucking Company" },
      { key: "3pl", label: "3PL / Third-Party Logistics" },
      { key: "shipper", label: "Shipper" },
      { key: "dispatcher", label: "Independent Dispatcher" },
      { key: "customs_broker", label: "Customs Broker" },
    ],
    enabledModules: [
      "contacts", "companies", "deals", "tasks", "campaigns",
      "email_deliverability", "automation", "analytics", "segmentation",
      "ab_testing", "api_webhooks", "paradigm_engine", "compliance",
      "load_management", "smtp_engine", "shipping_receiving",
      "accounts_receivable", "accounts_payable", "billing_invoicing",
    ],
    terminology: {
      deals: "Loads",
      deal: "Load",
      pipeline: "Load Board",
      companies: "Shippers / Carriers",
      company: "Shipper / Carrier",
      contacts: "Contacts",
      contact: "Contact",
    },
    highlightedFeatures: [
      "Load Management with lane tracking",
      "SMTP engine with 260 sending addresses",
      "Paradigm Engine for autonomous prospecting",
      "Compliance Fortress for CAN-SPAM/GDPR",
    ],
    aiContext: "This company operates in freight and logistics. They may be a freight broker, carrier, 3PL, or shipper. Key concerns include load management, lane rates, carrier relationships, shipper prospecting, and email deliverability for outreach campaigns.",
  },
  {
    key: "manufacturing",
    label: "Manufacturing",
    icon: "Factory",
    description: "Discrete, process, and contract manufacturers",
    subTypes: [
      { key: "discrete_mfg", label: "Discrete Manufacturing" },
      { key: "process_mfg", label: "Process Manufacturing" },
      { key: "contract_mfg", label: "Contract Manufacturing" },
      { key: "oem", label: "OEM / Original Equipment Manufacturer" },
    ],
    enabledModules: [
      "contacts", "companies", "deals", "tasks", "campaigns",
      "automation", "analytics", "segmentation", "api_webhooks",
      "shipping_receiving", "accounts_receivable", "accounts_payable", "billing_invoicing",
    ],
    terminology: {
      deals: "Orders",
      deal: "Order",
      pipeline: "Order Pipeline",
      companies: "Customers / Vendors",
      company: "Customer / Vendor",
      contacts: "Contacts",
      contact: "Contact",
    },
    highlightedFeatures: [
      "Shipping & Receiving for inbound materials and outbound goods",
      "Accounts Payable for vendor bills",
      "Accounts Receivable for customer invoicing",
      "Order pipeline management",
    ],
    aiContext: "This company is a manufacturer. Key concerns include order management, supplier relationships, shipping and receiving, accounts payable to vendors, and accounts receivable from customers.",
  },
  {
    key: "distribution_wholesale",
    label: "Distribution & Wholesale",
    icon: "Warehouse",
    description: "Regional distributors, national wholesalers, and importers/exporters",
    subTypes: [
      { key: "regional_distributor", label: "Regional Distributor" },
      { key: "national_wholesaler", label: "National Wholesaler" },
      { key: "importer_exporter", label: "Importer / Exporter" },
      { key: "food_beverage_dist", label: "Food & Beverage Distributor" },
    ],
    enabledModules: [
      "contacts", "companies", "deals", "tasks", "campaigns",
      "automation", "analytics", "segmentation", "api_webhooks",
      "shipping_receiving", "accounts_receivable", "accounts_payable", "billing_invoicing",
    ],
    terminology: {
      deals: "Orders",
      deal: "Order",
      pipeline: "Order Pipeline",
      companies: "Accounts",
      company: "Account",
      contacts: "Buyers / Contacts",
      contact: "Buyer / Contact",
    },
    highlightedFeatures: [
      "Shipping & Receiving for inbound and outbound inventory",
      "Customer invoicing and AR aging reports",
      "Vendor bill management and AP tracking",
      "Account and buyer relationship management",
    ],
    aiContext: "This company is a distributor or wholesaler. Key concerns include order fulfillment, inventory movement, shipping and receiving, customer invoicing, and vendor payment management.",
  },
  {
    key: "retail_ecommerce",
    label: "Retail & E-Commerce",
    icon: "ShoppingCart",
    description: "Brick-and-mortar retailers, online stores, and omnichannel businesses",
    subTypes: [
      { key: "brick_mortar", label: "Brick & Mortar Retail" },
      { key: "ecommerce", label: "E-Commerce / Online Store" },
      { key: "omnichannel", label: "Omnichannel Retail" },
      { key: "marketplace_seller", label: "Marketplace Seller (Amazon, eBay)" },
    ],
    enabledModules: [
      "contacts", "companies", "deals", "tasks", "campaigns",
      "email_deliverability", "automation", "analytics", "segmentation",
      "ab_testing", "api_webhooks",
      "shipping_receiving", "accounts_receivable", "billing_invoicing",
    ],
    terminology: {
      deals: "Orders",
      deal: "Order",
      pipeline: "Sales Pipeline",
      companies: "Vendors / Suppliers",
      company: "Vendor / Supplier",
      contacts: "Customers",
      contact: "Customer",
    },
    highlightedFeatures: [
      "Email campaign builder for promotions and newsletters",
      "Customer segmentation for targeted marketing",
      "Shipping & Receiving for inventory management",
      "A/B testing for email subject lines and content",
    ],
    aiContext: "This company is a retailer or e-commerce business. Key concerns include customer marketing, email campaigns, order management, shipping, and customer retention.",
  },
  {
    key: "professional_services",
    label: "Professional Services",
    icon: "Briefcase",
    description: "Consulting, legal, accounting, marketing agencies, and other service firms",
    subTypes: [
      { key: "consulting", label: "Consulting Firm" },
      { key: "legal", label: "Law Firm" },
      { key: "accounting", label: "Accounting / CPA Firm" },
      { key: "marketing_agency", label: "Marketing Agency" },
      { key: "staffing", label: "Staffing / Recruiting" },
      { key: "it_services", label: "IT Services / MSP" },
    ],
    enabledModules: [
      "contacts", "companies", "deals", "tasks", "campaigns",
      "email_deliverability", "automation", "analytics", "segmentation",
      "ab_testing", "api_webhooks", "paradigm_engine",
      "accounts_receivable", "billing_invoicing",
    ],
    terminology: {
      deals: "Projects",
      deal: "Project",
      pipeline: "Project Pipeline",
      companies: "Clients",
      company: "Client",
      contacts: "Contacts",
      contact: "Contact",
    },
    highlightedFeatures: [
      "Project pipeline management",
      "Client invoicing and retainer billing",
      "Paradigm Engine for business development prospecting",
      "Email campaigns for thought leadership and outreach",
    ],
    aiContext: "This company provides professional services (consulting, legal, accounting, agency, etc.). Key concerns include client relationship management, project pipelines, invoicing, and business development prospecting.",
  },
  {
    key: "healthcare",
    label: "Healthcare",
    icon: "HeartPulse",
    description: "Clinics, medical suppliers, home health agencies, and healthcare services",
    subTypes: [
      { key: "clinic_practice", label: "Clinic / Medical Practice" },
      { key: "medical_supplier", label: "Medical Supplier / Distributor" },
      { key: "home_health", label: "Home Health Agency" },
      { key: "dental", label: "Dental Practice" },
      { key: "mental_health", label: "Mental Health / Therapy" },
    ],
    enabledModules: [
      "contacts", "companies", "deals", "tasks", "campaigns",
      "automation", "analytics", "segmentation", "api_webhooks",
      "accounts_receivable", "accounts_payable", "billing_invoicing",
    ],
    terminology: {
      deals: "Cases",
      deal: "Case",
      pipeline: "Patient Pipeline",
      companies: "Facilities / Insurers",
      company: "Facility / Insurer",
      contacts: "Patients / Referrals",
      contact: "Patient / Referral",
    },
    highlightedFeatures: [
      "Patient and referral relationship management",
      "Billing and insurance claim tracking",
      "Appointment and task management",
      "Compliance-aware communication tools",
    ],
    aiContext: "This company operates in healthcare. Key concerns include patient management, referral tracking, billing and insurance, compliance, and appointment scheduling.",
  },
  {
    key: "construction_trades",
    label: "Construction & Trades",
    icon: "HardHat",
    description: "General contractors, subcontractors, specialty trades, and suppliers",
    subTypes: [
      { key: "general_contractor", label: "General Contractor" },
      { key: "subcontractor", label: "Subcontractor" },
      { key: "specialty_trade", label: "Specialty Trade (HVAC, Plumbing, Electrical)" },
      { key: "construction_supplier", label: "Construction Supplier" },
      { key: "home_services", label: "Home Services" },
    ],
    enabledModules: [
      "contacts", "companies", "deals", "tasks", "campaigns",
      "automation", "analytics", "api_webhooks",
      "shipping_receiving", "accounts_receivable", "accounts_payable", "billing_invoicing",
    ],
    terminology: {
      deals: "Jobs",
      deal: "Job",
      pipeline: "Job Pipeline",
      companies: "Clients / Subs",
      company: "Client / Sub",
      contacts: "Contacts",
      contact: "Contact",
    },
    highlightedFeatures: [
      "Job pipeline and project tracking",
      "Subcontractor and supplier management",
      "Job invoicing and progress billing",
      "Material receiving and purchase order tracking",
    ],
    aiContext: "This company is in construction or trades. Key concerns include job management, subcontractor coordination, material procurement, progress billing, and client relationship management.",
  },
  {
    key: "real_estate",
    label: "Real Estate",
    icon: "Building2",
    description: "Brokerages, property management companies, investors, and developers",
    subTypes: [
      { key: "brokerage", label: "Real Estate Brokerage" },
      { key: "property_management", label: "Property Management" },
      { key: "investor", label: "Real Estate Investor" },
      { key: "developer", label: "Real Estate Developer" },
      { key: "mortgage", label: "Mortgage / Lending" },
    ],
    enabledModules: [
      "contacts", "companies", "deals", "tasks", "campaigns",
      "email_deliverability", "automation", "analytics", "segmentation",
      "ab_testing", "api_webhooks", "paradigm_engine",
      "accounts_receivable", "billing_invoicing",
    ],
    terminology: {
      deals: "Listings",
      deal: "Listing",
      pipeline: "Property Pipeline",
      companies: "Properties / Firms",
      company: "Property / Firm",
      contacts: "Buyers / Sellers / Tenants",
      contact: "Buyer / Seller / Tenant",
    },
    highlightedFeatures: [
      "Property listing pipeline management",
      "Buyer, seller, and tenant relationship tracking",
      "Email campaigns for listings and market updates",
      "Paradigm Engine for lead generation",
    ],
    aiContext: "This company operates in real estate. Key concerns include property listings, buyer/seller/tenant relationships, lead generation, email marketing for listings, and commission tracking.",
  },
  {
    key: "financial_services",
    label: "Financial Services",
    icon: "DollarSign",
    description: "Insurance agencies, lenders, wealth management firms, and financial advisors",
    subTypes: [
      { key: "insurance_agency", label: "Insurance Agency" },
      { key: "lending", label: "Lending / Mortgage" },
      { key: "wealth_management", label: "Wealth Management" },
      { key: "financial_advisor", label: "Financial Advisor / Planner" },
      { key: "accounting_firm", label: "Accounting Firm" },
    ],
    enabledModules: [
      "contacts", "companies", "deals", "tasks", "campaigns",
      "email_deliverability", "automation", "analytics", "segmentation",
      "ab_testing", "api_webhooks", "paradigm_engine", "compliance",
      "accounts_receivable", "billing_invoicing",
    ],
    terminology: {
      deals: "Opportunities",
      deal: "Opportunity",
      pipeline: "Opportunity Pipeline",
      companies: "Firms / Institutions",
      company: "Firm / Institution",
      contacts: "Clients / Prospects",
      contact: "Client / Prospect",
    },
    highlightedFeatures: [
      "Client relationship management with compliance tracking",
      "Opportunity pipeline for policies and accounts",
      "Email campaigns with compliance-aware content",
      "Paradigm Engine for prospect discovery",
    ],
    aiContext: "This company provides financial services (insurance, lending, wealth management, etc.). Key concerns include client relationships, regulatory compliance, opportunity management, and prospect outreach.",
  },
  {
    key: "technology",
    label: "Technology",
    icon: "Code2",
    description: "SaaS companies, IT service providers, software agencies, and tech startups",
    subTypes: [
      { key: "saas", label: "SaaS / Software Company" },
      { key: "it_services", label: "IT Services / MSP" },
      { key: "software_agency", label: "Software Development Agency" },
      { key: "tech_startup", label: "Tech Startup" },
      { key: "data_analytics", label: "Data & Analytics" },
    ],
    enabledModules: [
      "contacts", "companies", "deals", "tasks", "campaigns",
      "email_deliverability", "automation", "analytics", "segmentation",
      "ab_testing", "api_webhooks", "paradigm_engine",
      "accounts_receivable", "billing_invoicing",
    ],
    terminology: {
      deals: "Opportunities",
      deal: "Opportunity",
      pipeline: "Sales Pipeline",
      companies: "Accounts",
      company: "Account",
      contacts: "Contacts",
      contact: "Contact",
    },
    highlightedFeatures: [
      "SaaS sales pipeline management",
      "Email campaigns for product launches and updates",
      "Paradigm Engine for outbound prospecting",
      "API & Webhook integration for your tech stack",
    ],
    aiContext: "This company is a technology business (SaaS, IT services, software agency, etc.). Key concerns include sales pipeline management, customer success, product-led growth, email campaigns, and outbound prospecting.",
  },
  {
    key: "general",
    label: "General Business",
    icon: "Building",
    description: "Any business type not listed above",
    subTypes: [
      { key: "general", label: "General Business" },
    ],
    enabledModules: [
      "contacts", "companies", "deals", "tasks", "campaigns",
      "automation", "analytics", "segmentation", "api_webhooks",
      "accounts_receivable", "accounts_payable", "billing_invoicing",
    ],
    terminology: {
      deals: "Deals",
      deal: "Deal",
      pipeline: "Pipeline",
      companies: "Companies",
      company: "Company",
      contacts: "Contacts",
      contact: "Contact",
    },
    highlightedFeatures: [
      "Contact and company management",
      "Deal pipeline tracking",
      "Email campaigns",
      "Task and activity management",
    ],
    aiContext: "This is a general business. Help them use the CRM effectively for contact management, deal tracking, email campaigns, and business automation.",
  },
];

export const CATEGORY_MAP = Object.fromEntries(
  BUSINESS_CATEGORIES.map((c) => [c.key, c])
) as Record<BusinessCategoryKey, BusinessCategory>;

/** Get a category by key, falling back to 'general' */
export function getCategory(key?: string | null): BusinessCategory {
  return CATEGORY_MAP[key as BusinessCategoryKey] ?? CATEGORY_MAP.general;
}

/** Get the terminology for a company's category */
export function getTerminology(categoryKey?: string | null): Required<TerminologyOverride> {
  const cat = getCategory(categoryKey);
  return {
    deals: cat.terminology.deals ?? "Deals",
    deal: cat.terminology.deal ?? "Deal",
    pipeline: cat.terminology.pipeline ?? "Pipeline",
    companies: cat.terminology.companies ?? "Companies",
    company: cat.terminology.company ?? "Company",
    contacts: cat.terminology.contacts ?? "Contacts",
    contact: cat.terminology.contact ?? "Contact",
  };
}

/** Check if a module is enabled for a given category */
export function isModuleEnabled(categoryKey: string | null | undefined, module: VerticalModule): boolean {
  const cat = getCategory(categoryKey);
  return cat.enabledModules.includes(module);
}

/** Get the list of enabled modules for a given category key */
export function getCategoryFeatures(categoryKey?: string | null): VerticalModule[] {
  const cat = getCategory(categoryKey);
  return cat.enabledModules;
}

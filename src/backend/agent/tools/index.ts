import type { ToolSet } from "ai";

import { getCompanyProfile } from "./get-company-profile.ts";
import { getDocument } from "./get-document.ts";
import { getFinancials } from "./get-financials.ts";
import { searchCompanies } from "./search-companies.ts";
import { searchDocuments } from "./search-documents.ts";

export const researchTools = {
  searchCompanies,
  getCompanyProfile,
  getFinancials,
  searchDocuments,
  getDocument,
} satisfies ToolSet;

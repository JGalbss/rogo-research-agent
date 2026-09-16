import { Array as Arr, Data } from "effect";
import { type Company, companies } from "../../../utils/data.ts";
import { ToolError } from "./tool-error.ts";

const LEGAL_SUFFIXES = /\b(corp|corporation|inc|incorporated|ltd|limited|plc|co)\b/g;

const normalize = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[.,'’]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const withoutSuffix = (normalized: string): string =>
  normalized.replace(LEGAL_SUFFIXES, "").trim();

export type CompanyMatch = Data.TaggedEnum<{
  Found: { readonly company: Company };
  Ambiguous: { readonly candidates: ReadonlyArray<Company> };
  Unknown: {};
}>;

export const CompanyMatch = Data.taggedEnum<CompanyMatch>();

export const coverageList = (): string =>
  companies.map((company) => `${company.name} (${company.ticker})`).join(", ");

export const findCompanies = (query: string): ReadonlyArray<Company> => {
  const needle = normalize(query);
  if (needle.length === 0) return [];
  const byName = companies.filter(
    (company) =>
      normalize(company.name).includes(needle) ||
      withoutSuffix(normalize(company.name)) === withoutSuffix(needle),
  );
  return Arr.match(byName, {
    onEmpty: () => companies.filter((company) => company.ticker.toLowerCase() === needle),
    onNonEmpty: (found) => found,
  });
};

export const resolveCompany = (query: string): CompanyMatch => {
  const needle = normalize(query);
  const ticker = query.trim();
  const exact = companies.find(
    (company) => normalize(company.name) === needle || company.ticker === ticker,
  );
  if (exact !== undefined) return CompanyMatch.Found({ company: exact });

  return Arr.match(findCompanies(query), {
    onEmpty: () => CompanyMatch.Unknown(),
    onNonEmpty: (candidates) => {
      if (candidates.length === 1) return CompanyMatch.Found({ company: candidates[0] });
      return CompanyMatch.Ambiguous({ candidates });
    },
  });
};

export const requireCompany = (query: string): Company =>
  CompanyMatch.$match(resolveCompany(query), {
    Found: ({ company }) => company,
    Ambiguous: ({ candidates }) => {
      const names = candidates.map((company) => `${company.name} (${company.ticker})`).join(" and ");
      throw new ToolError(`"${query}" matches ${names}; pass one exact company name or ticker`);
    },
    Unknown: () => {
      throw new ToolError(
        `no company named "${query}" in the coverage universe; valid companies: ${coverageList()}`,
      );
    },
  });

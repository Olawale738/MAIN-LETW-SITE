/**
 * Country reference data — shared by signup form, member directory,
 * /admin/users, ChurchLocation admin form, and the public worldwide-reach map.
 *
 * Keeping the data here client-side means dropdowns work without a backend
 * round-trip and country names render the same everywhere.
 */

export type Continent =
    | 'Africa' | 'Asia' | 'Europe' | 'North America'
    | 'South America' | 'Oceania' | 'Antarctica'

export interface Country {
    code: string         // ISO 3166-1 alpha-2
    name: string
    continent: Continent
    flag?: string        // emoji shortcut
}

export const COUNTRIES: Country[] = [
    // Africa
    { code: 'NG', name: 'Nigeria',        continent: 'Africa', flag: '🇳🇬' },
    { code: 'GH', name: 'Ghana',          continent: 'Africa', flag: '🇬🇭' },
    { code: 'KE', name: 'Kenya',          continent: 'Africa', flag: '🇰🇪' },
    { code: 'ZA', name: 'South Africa',   continent: 'Africa', flag: '🇿🇦' },
    { code: 'UG', name: 'Uganda',         continent: 'Africa', flag: '🇺🇬' },
    { code: 'TZ', name: 'Tanzania',       continent: 'Africa', flag: '🇹🇿' },
    { code: 'ET', name: 'Ethiopia',       continent: 'Africa', flag: '🇪🇹' },
    { code: 'EG', name: 'Egypt',          continent: 'Africa', flag: '🇪🇬' },
    { code: 'MA', name: 'Morocco',        continent: 'Africa', flag: '🇲🇦' },
    { code: 'SN', name: 'Senegal',        continent: 'Africa', flag: '🇸🇳' },
    { code: 'CM', name: 'Cameroon',       continent: 'Africa', flag: '🇨🇲' },
    { code: 'CI', name: "Côte d'Ivoire",  continent: 'Africa', flag: '🇨🇮' },
    { code: 'RW', name: 'Rwanda',         continent: 'Africa', flag: '🇷🇼' },
    { code: 'ZM', name: 'Zambia',         continent: 'Africa', flag: '🇿🇲' },
    { code: 'ZW', name: 'Zimbabwe',       continent: 'Africa', flag: '🇿🇼' },
    { code: 'BJ', name: 'Benin',          continent: 'Africa', flag: '🇧🇯' },
    { code: 'TG', name: 'Togo',           continent: 'Africa', flag: '🇹🇬' },
    { code: 'BF', name: 'Burkina Faso',   continent: 'Africa', flag: '🇧🇫' },
    { code: 'AO', name: 'Angola',         continent: 'Africa', flag: '🇦🇴' },
    { code: 'MZ', name: 'Mozambique',     continent: 'Africa', flag: '🇲🇿' },
    { code: 'NA', name: 'Namibia',        continent: 'Africa', flag: '🇳🇦' },
    { code: 'BW', name: 'Botswana',       continent: 'Africa', flag: '🇧🇼' },

    // North America
    { code: 'US', name: 'United States',  continent: 'North America', flag: '🇺🇸' },
    { code: 'CA', name: 'Canada',         continent: 'North America', flag: '🇨🇦' },
    { code: 'MX', name: 'Mexico',         continent: 'North America', flag: '🇲🇽' },
    { code: 'JM', name: 'Jamaica',        continent: 'North America', flag: '🇯🇲' },
    { code: 'TT', name: 'Trinidad & Tobago', continent: 'North America', flag: '🇹🇹' },
    { code: 'BS', name: 'Bahamas',        continent: 'North America', flag: '🇧🇸' },
    { code: 'BB', name: 'Barbados',       continent: 'North America', flag: '🇧🇧' },

    // South America
    { code: 'BR', name: 'Brazil',         continent: 'South America', flag: '🇧🇷' },
    { code: 'AR', name: 'Argentina',      continent: 'South America', flag: '🇦🇷' },
    { code: 'CO', name: 'Colombia',       continent: 'South America', flag: '🇨🇴' },
    { code: 'PE', name: 'Peru',           continent: 'South America', flag: '🇵🇪' },
    { code: 'CL', name: 'Chile',          continent: 'South America', flag: '🇨🇱' },
    { code: 'EC', name: 'Ecuador',        continent: 'South America', flag: '🇪🇨' },
    { code: 'VE', name: 'Venezuela',      continent: 'South America', flag: '🇻🇪' },

    // Europe
    { code: 'GB', name: 'United Kingdom', continent: 'Europe', flag: '🇬🇧' },
    { code: 'IE', name: 'Ireland',        continent: 'Europe', flag: '🇮🇪' },
    { code: 'FR', name: 'France',         continent: 'Europe', flag: '🇫🇷' },
    { code: 'DE', name: 'Germany',        continent: 'Europe', flag: '🇩🇪' },
    { code: 'IT', name: 'Italy',          continent: 'Europe', flag: '🇮🇹' },
    { code: 'ES', name: 'Spain',          continent: 'Europe', flag: '🇪🇸' },
    { code: 'PT', name: 'Portugal',       continent: 'Europe', flag: '🇵🇹' },
    { code: 'NL', name: 'Netherlands',    continent: 'Europe', flag: '🇳🇱' },
    { code: 'BE', name: 'Belgium',        continent: 'Europe', flag: '🇧🇪' },
    { code: 'CH', name: 'Switzerland',    continent: 'Europe', flag: '🇨🇭' },
    { code: 'AT', name: 'Austria',        continent: 'Europe', flag: '🇦🇹' },
    { code: 'NO', name: 'Norway',         continent: 'Europe', flag: '🇳🇴' },
    { code: 'SE', name: 'Sweden',         continent: 'Europe', flag: '🇸🇪' },
    { code: 'DK', name: 'Denmark',        continent: 'Europe', flag: '🇩🇰' },
    { code: 'FI', name: 'Finland',        continent: 'Europe', flag: '🇫🇮' },
    { code: 'PL', name: 'Poland',         continent: 'Europe', flag: '🇵🇱' },
    { code: 'GR', name: 'Greece',         continent: 'Europe', flag: '🇬🇷' },
    { code: 'UA', name: 'Ukraine',        continent: 'Europe', flag: '🇺🇦' },
    { code: 'RO', name: 'Romania',        continent: 'Europe', flag: '🇷🇴' },

    // Asia
    { code: 'IN', name: 'India',          continent: 'Asia', flag: '🇮🇳' },
    { code: 'CN', name: 'China',          continent: 'Asia', flag: '🇨🇳' },
    { code: 'JP', name: 'Japan',          continent: 'Asia', flag: '🇯🇵' },
    { code: 'KR', name: 'South Korea',    continent: 'Asia', flag: '🇰🇷' },
    { code: 'PH', name: 'Philippines',    continent: 'Asia', flag: '🇵🇭' },
    { code: 'ID', name: 'Indonesia',      continent: 'Asia', flag: '🇮🇩' },
    { code: 'MY', name: 'Malaysia',       continent: 'Asia', flag: '🇲🇾' },
    { code: 'SG', name: 'Singapore',      continent: 'Asia', flag: '🇸🇬' },
    { code: 'TH', name: 'Thailand',       continent: 'Asia', flag: '🇹🇭' },
    { code: 'VN', name: 'Vietnam',        continent: 'Asia', flag: '🇻🇳' },
    { code: 'PK', name: 'Pakistan',       continent: 'Asia', flag: '🇵🇰' },
    { code: 'BD', name: 'Bangladesh',     continent: 'Asia', flag: '🇧🇩' },
    { code: 'AE', name: 'United Arab Emirates', continent: 'Asia', flag: '🇦🇪' },
    { code: 'SA', name: 'Saudi Arabia',   continent: 'Asia', flag: '🇸🇦' },
    { code: 'TR', name: 'Türkiye',        continent: 'Asia', flag: '🇹🇷' },
    { code: 'IL', name: 'Israel',         continent: 'Asia', flag: '🇮🇱' },

    // Oceania
    { code: 'AU', name: 'Australia',      continent: 'Oceania', flag: '🇦🇺' },
    { code: 'NZ', name: 'New Zealand',    continent: 'Oceania', flag: '🇳🇿' },
    { code: 'FJ', name: 'Fiji',           continent: 'Oceania', flag: '🇫🇯' },
    { code: 'PG', name: 'Papua New Guinea', continent: 'Oceania', flag: '🇵🇬' },
]

export const CONTINENTS: Continent[] = [
    'Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania',
]

export function findCountry(code: string): Country | undefined {
    if (!code) return undefined
    const c = code.toUpperCase()
    return COUNTRIES.find(x => x.code === c)
}

export function countriesIn(continent: Continent): Country[] {
    return COUNTRIES.filter(c => c.continent === continent).sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Extract structured city / state / postcode from a Google `address_components`
 * array.
 *
 * Both Google calls in Location.tsx already receive this data and were
 * discarding it — the Place Details request passes no `fields` parameter, so the
 * full response (including address_components) is already being requested and
 * billed for. Reading it here therefore costs no extra API calls.
 *
 * `state` uses `short_name` ("TX", not "Texas") so it fits a list row and
 * matches how the client asked for it ("City, State").
 */

interface AddressComponent {
  long_name?: string;
  short_name?: string;
  types?: string[];
}

export interface ParsedAddress {
  city: string | null;
  state: string | null;
  postalCode: string | null;
}

export const parseAddressComponents = (
  components?: AddressComponent[] | null,
): ParsedAddress => {
  const list = Array.isArray(components) ? components : [];
  const find = (type: string) =>
    list.find(component => component.types?.includes(type)) ?? null;

  return {
    city:
      find('locality')?.long_name ??
      // Outside the US, city often lands on postal_town or a sublocality.
      find('postal_town')?.long_name ??
      find('sublocality_level_1')?.long_name ??
      find('sublocality')?.long_name ??
      // Rural US addresses sometimes only carry the county.
      find('administrative_area_level_2')?.long_name ??
      null,
    state: find('administrative_area_level_1')?.short_name ?? null,
    postalCode: find('postal_code')?.long_name ?? null,
  };
};

//@flow
export default function moonIsAscending (moon: *) {
  const { ecliptic: { longitude } } = moon;
  return longitude < 93.44 || longitude >= 271.26;
}
